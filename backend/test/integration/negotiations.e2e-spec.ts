import * as request from "supertest";
import { TestEnvironment } from "../setup/test-environment";

describe("Negotiations Integration Tests", () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;
  let negotiationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();

    // Create a base trade operation for negotiations
    const response = await request(env.app.getHttpServer())
      .post("/api/trade-operations")
      .set("Authorization", `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 7.5,
      })
      .expect(201);

    tradeOperationId = response.body.id;

    // Select sellers
    await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/sellers`)
      .set("Authorization", `Bearer ${env.tokens.admin}`)
      .send({
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 60,
          },
          {
            sellerId: testData.users.seller2.id,
            saleListingId: testData.saleListings[1].id,
            requestedQuantity: 40,
          },
        ],
      })
      .expect(201);
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe("Buyer Negotiations", () => {
    it("should create buyer offer with profit impact analysis", async () => {
      const offerDto = {
        tradeOperationId,
        buyerId: testData.users.buyer.id,
        offeredPrice: 370,
        quantity: 100,
        message: "Requesting slight price reduction due to bulk order",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/negotiations/buyer-offer")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(offerDto)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("type", "BUYER_OFFER");
      expect(response.body).toHaveProperty("status", "PENDING");
      expect(response.body).toHaveProperty("offeredPrice", 370);

      expect(response.body).toHaveProperty("profitImpact");
      expect(response.body.profitImpact).toHaveProperty("currentProfit");
      expect(response.body.profitImpact).toHaveProperty("newProfit");
      expect(response.body.profitImpact).toHaveProperty("profitChange");
      expect(response.body.profitImpact).toHaveProperty("marginChange");
      expect(response.body.profitImpact).toHaveProperty("viability");

      negotiationId = response.body.id;
    });

    it("should validate minimum margin when accepting buyer offer", async () => {
      const lowOfferDto = {
        tradeOperationId,
        buyerId: testData.users.buyer.id,
        offeredPrice: 355, // Too low - would violate 5% minimum margin
        quantity: 100,
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/negotiations/buyer-offer")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(lowOfferDto)
        .expect(201);

      expect(response.body.profitImpact.viability).toBe("UNVIABLE");
      expect(response.body).toHaveProperty("warning");
      expect(response.body.warning).toContain("minimum margin");
      expect(response.body).toHaveProperty("recommendation", "REJECT");
    });

    it("should counter buyer offer", async () => {
      const counterDto = {
        negotiationId,
        counterPrice: 372,
        message: "We can offer €372/ton as our best price",
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(counterDto)
        .expect(201);

      expect(response.body).toHaveProperty("type", "COUNTER_OFFER");
      expect(response.body).toHaveProperty("roundNumber", 2);
      expect(response.body).toHaveProperty("counterPrice", 372);
      expect(response.body).toHaveProperty("previousPrice", 370);

      expect(response.body).toHaveProperty("convergence");
      expect(response.body.convergence).toHaveProperty("priceDifference", 2);
      expect(response.body.convergence).toHaveProperty("percentageDifference");
      expect(response.body.convergence).toHaveProperty("isConverging", true);
    });
  });

  describe("Seller Negotiations", () => {
    it("should create seller offer with profit impact", async () => {
      const offerDto = {
        tradeOperationId,
        sellerId: testData.users.seller1.id,
        offeredPrice: 342, // Lower than original €345
        quantity: 60,
        message: "Can offer better price for guaranteed sale",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/negotiations/seller-offer")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(offerDto)
        .expect(201);

      expect(response.body).toHaveProperty("type", "SELLER_OFFER");
      expect(response.body).toHaveProperty("offeredPrice", 342);

      expect(response.body.profitImpact).toHaveProperty("currentProfit");
      expect(response.body.profitImpact).toHaveProperty("newProfit");
      expect(response.body.profitImpact.newProfit).toBeGreaterThan(
        response.body.profitImpact.currentProfit,
      );
    });

    it("should handle multiple seller negotiations simultaneously", async () => {
      const seller1Offer = {
        tradeOperationId,
        sellerId: testData.users.seller1.id,
        offeredPrice: 343,
        quantity: 60,
      };

      const seller2Offer = {
        tradeOperationId,
        sellerId: testData.users.seller2.id,
        offeredPrice: 348,
        quantity: 40,
      };

      const [response1, response2] = await Promise.all([
        request(env.app.getHttpServer())
          .post("/api/negotiations/seller-offer")
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send(seller1Offer)
          .expect(201),
        request(env.app.getHttpServer())
          .post("/api/negotiations/seller-offer")
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send(seller2Offer)
          .expect(201),
      ]);

      expect(response1.body).toHaveProperty(
        "sellerId",
        testData.users.seller1.id,
      );
      expect(response2.body).toHaveProperty(
        "sellerId",
        testData.users.seller2.id,
      );

      // Both should have profit impact calculations
      expect(response1.body).toHaveProperty("profitImpact");
      expect(response2.body).toHaveProperty("profitImpact");
    });
  });

  describe("Bulk Negotiations", () => {
    it("should negotiate with all parties simultaneously", async () => {
      const bulkDto = {
        tradeOperationId,
        buyerOffer: {
          price: 373,
          message: "Final offer for bulk purchase",
        },
        sellerOffers: [
          {
            sellerId: testData.users.seller1.id,
            price: 344,
            quantity: 60,
          },
          {
            sellerId: testData.users.seller2.id,
            price: 349,
            quantity: 40,
          },
        ],
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/negotiations/bulk-negotiate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(bulkDto)
        .expect(201);

      expect(response.body).toHaveProperty("negotiations");
      expect(response.body.negotiations).toHaveProperty("buyer");
      expect(response.body.negotiations).toHaveProperty("sellers");
      expect(response.body.negotiations.sellers).toHaveLength(2);

      expect(response.body).toHaveProperty("aggregateProfitImpact");
      expect(response.body.aggregateProfitImpact).toHaveProperty(
        "totalRevenue",
      );
      expect(response.body.aggregateProfitImpact).toHaveProperty("totalCosts");
      expect(response.body.aggregateProfitImpact).toHaveProperty("netProfit");
      expect(response.body.aggregateProfitImpact).toHaveProperty(
        "profitMargin",
      );
      expect(response.body.aggregateProfitImpact).toHaveProperty("meetsTarget");

      expect(response.body).toHaveProperty("recommendation");
      expect(response.body.recommendation).toHaveProperty("action");
      expect(response.body.recommendation).toHaveProperty("reasoning");
    });

    it("should optimize negotiations for target margin", async () => {
      const optimizeDto = {
        tradeOperationId,
        targetMargin: 8.0,
        constraints: {
          maxBuyerPrice: 376,
          minSellerDiscount: 2, // Max 2% discount from sellers
          preserveRelationships: true,
        },
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/negotiations/optimize")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(optimizeDto)
        .expect(201);

      expect(response.body).toHaveProperty("optimizedPrices");
      expect(response.body.optimizedPrices).toHaveProperty("buyerPrice");
      expect(response.body.optimizedPrices).toHaveProperty("sellerPrices");

      expect(response.body).toHaveProperty("achievedMargin");
      expect(response.body.achievedMargin).toBeGreaterThanOrEqual(7.5);
      expect(response.body.achievedMargin).toBeLessThanOrEqual(8.5);

      expect(response.body).toHaveProperty("adjustments");
      expect(response.body.adjustments).toHaveProperty("buyerAdjustment");
      expect(response.body.adjustments).toHaveProperty("sellerAdjustments");

      expect(response.body).toHaveProperty("feasibility");
      expect(response.body.feasibility).toHaveProperty("isPossible");
      expect(response.body.feasibility).toHaveProperty("requiredChanges");
    });
  });

  describe("Negotiation Tracking", () => {
    it("should track profit impact throughout negotiation", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/${negotiationId}/profit-impact`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("rounds");
      expect(response.body.rounds).toBeInstanceOf(Array);

      response.body.rounds.forEach((round: any) => {
        expect(round).toHaveProperty("roundNumber");
        expect(round).toHaveProperty("price");
        expect(round).toHaveProperty("profit");
        expect(round).toHaveProperty("margin");
        expect(round).toHaveProperty("timestamp");
      });

      expect(response.body).toHaveProperty("trend");
      expect(response.body.trend).toHaveProperty("priceDirection");
      expect(response.body.trend).toHaveProperty("profitDirection");
      expect(response.body.trend).toHaveProperty("convergenceRate");

      expect(response.body).toHaveProperty("summary");
      expect(response.body.summary).toHaveProperty("initialProfit");
      expect(response.body.summary).toHaveProperty("currentProfit");
      expect(response.body.summary).toHaveProperty("totalChange");
    });

    it("should get negotiation history for trade operation", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade/${tradeOperationId}/history`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("negotiations");
      expect(response.body.negotiations).toBeInstanceOf(Array);

      expect(response.body).toHaveProperty("statistics");
      expect(response.body.statistics).toHaveProperty("totalNegotiations");
      expect(response.body.statistics).toHaveProperty("avgRounds");
      expect(response.body.statistics).toHaveProperty("successRate");
      expect(response.body.statistics).toHaveProperty("avgProfitChange");

      expect(response.body).toHaveProperty("parties");
      expect(response.body.parties).toHaveProperty("buyers");
      expect(response.body.parties).toHaveProperty("sellers");
    });
  });

  describe("AI-Powered Price Suggestions", () => {
    it("should suggest optimal prices based on historical data", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade/${tradeOperationId}/suggest-prices`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("suggestions");

      expect(response.body.suggestions).toHaveProperty("buyer");
      expect(response.body.suggestions.buyer).toHaveProperty("suggestedPrice");
      expect(response.body.suggestions.buyer).toHaveProperty("confidence");
      expect(response.body.suggestions.buyer).toHaveProperty("reasoning");
      expect(response.body.suggestions.buyer).toHaveProperty(
        "expectedAcceptance",
      );

      expect(response.body.suggestions).toHaveProperty("sellers");
      expect(response.body.suggestions.sellers).toBeInstanceOf(Array);

      response.body.suggestions.sellers.forEach((seller: any) => {
        expect(seller).toHaveProperty("sellerId");
        expect(seller).toHaveProperty("suggestedPrice");
        expect(seller).toHaveProperty("confidence");
        expect(seller).toHaveProperty("expectedAcceptance");
      });

      expect(response.body).toHaveProperty("strategy");
      expect(response.body.strategy).toHaveProperty("approach");
      expect(response.body.strategy).toHaveProperty("expectedMargin");
      expect(response.body.strategy).toHaveProperty("riskLevel");
      expect(response.body.strategy).toHaveProperty("timeToClose");
    });

    it("should adapt suggestions based on negotiation style", async () => {
      const aggressiveResponse = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade/${tradeOperationId}/suggest-prices`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({ style: "AGGRESSIVE" })
        .expect(200);

      const conservativeResponse = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade/${tradeOperationId}/suggest-prices`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({ style: "CONSERVATIVE" })
        .expect(200);

      // Aggressive should aim for higher margins
      expect(aggressiveResponse.body.strategy.expectedMargin).toBeGreaterThan(
        conservativeResponse.body.strategy.expectedMargin,
      );

      // Conservative should have higher acceptance probability
      expect(
        conservativeResponse.body.suggestions.buyer.expectedAcceptance,
      ).toBeGreaterThan(
        aggressiveResponse.body.suggestions.buyer.expectedAcceptance,
      );
    });
  });

  describe("Constraint Validation", () => {
    it("should validate negotiation against business constraints", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/validate`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          proposedPrice: 368,
          party: "BUYER",
        })
        .expect(201);

      expect(response.body).toHaveProperty("isValid");
      expect(response.body).toHaveProperty("constraints");

      const constraints = response.body.constraints;
      expect(constraints).toHaveProperty("minimumMargin");
      expect(constraints.minimumMargin).toHaveProperty("required", 5);
      expect(constraints.minimumMargin).toHaveProperty("achieved");
      expect(constraints.minimumMargin).toHaveProperty("passed");

      expect(constraints).toHaveProperty("targetMargin");
      expect(constraints.targetMargin).toHaveProperty("target");
      expect(constraints.targetMargin).toHaveProperty("achieved");
      expect(constraints.targetMargin).toHaveProperty("met");

      expect(constraints).toHaveProperty("priceRange");
      expect(constraints.priceRange).toHaveProperty("min");
      expect(constraints.priceRange).toHaveProperty("max");
      expect(constraints.priceRange).toHaveProperty("proposed", 368);
      expect(constraints.priceRange).toHaveProperty("inRange");

      expect(response.body).toHaveProperty("recommendations");
    });

    it("should check multi-party constraint compatibility", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade/${tradeOperationId}/validate-all`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          buyerPrice: 372,
          sellerPrices: [
            { sellerId: testData.users.seller1.id, price: 344 },
            { sellerId: testData.users.seller2.id, price: 349 },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty("overallValid");
      expect(response.body).toHaveProperty("profitMargin");
      expect(response.body).toHaveProperty("violations");
      expect(response.body.violations).toBeInstanceOf(Array);

      if (response.body.violations.length > 0) {
        response.body.violations.forEach((violation: any) => {
          expect(violation).toHaveProperty("constraint");
          expect(violation).toHaveProperty("severity");
          expect(violation).toHaveProperty("impact");
          expect(violation).toHaveProperty("suggestion");
        });
      }

      expect(response.body).toHaveProperty("optimization");
      expect(response.body.optimization).toHaveProperty("canOptimize");
      if (response.body.optimization.canOptimize) {
        expect(response.body.optimization).toHaveProperty(
          "suggestedAdjustments",
        );
      }
    });
  });

  describe("Negotiation Finalization", () => {
    it("should finalize successful negotiation", async () => {
      const finalizeDto = {
        agreedPrices: {
          buyerPrice: 372,
          sellerPrices: [
            { sellerId: testData.users.seller1.id, price: 344, quantity: 60 },
            { sellerId: testData.users.seller2.id, price: 349, quantity: 40 },
          ],
        },
        transportCost: 1200,
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/finalize`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(finalizeDto)
        .expect(201);

      expect(response.body).toHaveProperty("status", "ACCEPTED");
      expect(response.body).toHaveProperty("finalTerms");
      expect(response.body.finalTerms).toHaveProperty("buyerPrice", 372);
      expect(response.body.finalTerms).toHaveProperty("sellerPrices");

      expect(response.body).toHaveProperty("finalProfit");
      expect(response.body.finalProfit).toHaveProperty("revenue");
      expect(response.body.finalProfit).toHaveProperty("costs");
      expect(response.body.finalProfit).toHaveProperty("netProfit");
      expect(response.body.finalProfit).toHaveProperty("profitMargin");

      expect(response.body).toHaveProperty("performance");
      expect(response.body.performance).toHaveProperty("totalRounds");
      expect(response.body.performance).toHaveProperty("duration");
      expect(response.body.performance).toHaveProperty("marginImprovement");
      expect(response.body.performance).toHaveProperty("successMetrics");
    });

    it("should reject negotiation if parties cannot agree", async () => {
      const rejectDto = {
        reason: "PRICE_DISAGREEMENT",
        finalOffers: {
          buyer: 365,
          sellers: [
            { sellerId: testData.users.seller1.id, price: 350 },
            { sellerId: testData.users.seller2.id, price: 355 },
          ],
        },
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(rejectDto)
        .expect(201);

      expect(response.body).toHaveProperty("status", "REJECTED");
      expect(response.body).toHaveProperty("reason", "PRICE_DISAGREEMENT");
      expect(response.body).toHaveProperty("finalGap");
      expect(response.body.finalGap).toHaveProperty("amount");
      expect(response.body.finalGap).toHaveProperty("percentage");

      expect(response.body).toHaveProperty("analysis");
      expect(response.body.analysis).toHaveProperty("stickingPoints");
      expect(response.body.analysis).toHaveProperty("alternativeStrategies");
      expect(response.body.analysis).toHaveProperty("lessonsLearned");
    });
  });

  describe("Negotiation Analytics", () => {
    it("should provide negotiation performance metrics", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/negotiations/analytics")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty("summary");
      expect(response.body.summary).toHaveProperty("totalNegotiations");
      expect(response.body.summary).toHaveProperty("successRate");
      expect(response.body.summary).toHaveProperty("avgRoundsToClose");
      expect(response.body.summary).toHaveProperty("avgMarginImprovement");

      expect(response.body).toHaveProperty("trends");
      expect(response.body.trends).toHaveProperty("successRateTrend");
      expect(response.body.trends).toHaveProperty("marginTrend");
      expect(response.body.trends).toHaveProperty("velocityTrend");

      expect(response.body).toHaveProperty("partyAnalysis");
      expect(response.body.partyAnalysis).toHaveProperty("buyers");
      expect(response.body.partyAnalysis).toHaveProperty("sellers");

      expect(response.body).toHaveProperty("bestPractices");
      expect(response.body.bestPractices).toHaveProperty(
        "mostSuccessfulStrategies",
      );
      expect(response.body.bestPractices).toHaveProperty("optimalRoundCount");
      expect(response.body.bestPractices).toHaveProperty("idealPriceMovements");
    });
  });
});
