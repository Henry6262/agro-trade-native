#!/usr/bin/env ts-node

/**
 * Comprehensive API Test Runner
 * Tests all profit-based trading endpoints
 */

import * as axios from "axios";
import { AxiosInstance } from "axios";
import * as chalk from "chalk";

// Configuration
const BASE_URL = process.env.API_URL || "http://localhost:4000";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "test-token";

// Test result tracking
interface TestResult {
  endpoint: string;
  method: string;
  status: "PASS" | "FAIL" | "SKIP";
  responseTime?: number;
  error?: string;
  data?: any;
}

class APITestRunner {
  private api: AxiosInstance;
  private results: TestResult[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  // Test utilities
  private async runTest(
    method: string,
    endpoint: string,
    data?: any,
    expectedStatus?: number,
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
      });

      const responseTime = Date.now() - startTime;

      const result: TestResult = {
        endpoint,
        method,
        status: "PASS",
        responseTime,
        data: response.data,
      };

      // Check expected status if provided
      if (expectedStatus && response.status !== expectedStatus) {
        result.status = "FAIL";
        result.error = `Expected status ${expectedStatus}, got ${response.status}`;
      }

      // Check for error responses
      if (response.status >= 400) {
        result.status = "FAIL";
        result.error = `HTTP ${response.status}: ${JSON.stringify(response.data)}`;
      }

      return result;
    } catch (error: any) {
      return {
        endpoint,
        method,
        status: "FAIL",
        error: error.message,
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Trade Operations Tests
  async testTradeOperations() {
    console.log(chalk.blue("\n📊 Testing Trade Operations Endpoints...\n"));

    // Create trade operation
    const createResult = await this.runTest("POST", "/api/trade-operations", {
      buyListingId: "test-buy-listing-001",
      targetProfitMargin: 7.5,
    });
    this.results.push(createResult);
    this.printResult(createResult);

    // If creation successful, use the ID for other tests
    let tradeOpId = "test-trade-op-001";
    if (createResult.status === "PASS" && createResult.data?.id) {
      tradeOpId = createResult.data.id;
    }

    // Find sellers
    const findSellersResult = await this.runTest(
      "GET",
      `/api/trade-operations/${tradeOpId}/find-sellers?maxDistance=100`,
    );
    this.results.push(findSellersResult);
    this.printResult(findSellersResult);

    // Select sellers
    const selectSellersResult = await this.runTest(
      "POST",
      `/api/trade-operations/${tradeOpId}/select-sellers`,
      {
        sellers: [
          { sellerId: "test-seller-001", requestedQuantity: 50 },
          { sellerId: "test-seller-002", requestedQuantity: 50 },
        ],
      },
    );
    this.results.push(selectSellersResult);
    this.printResult(selectSellersResult);

    // Optimize transport
    const optimizeResult = await this.runTest(
      "POST",
      `/api/trade-operations/${tradeOpId}/optimize-transport`,
      { algorithm: "TSP_NEAREST" },
    );
    this.results.push(optimizeResult);
    this.printResult(optimizeResult);

    // List operations
    const listResult = await this.runTest(
      "GET",
      "/api/trade-operations?status=PENDING",
    );
    this.results.push(listResult);
    this.printResult(listResult);
  }

  // Profit Calculation Tests
  async testProfitCalculations() {
    console.log(chalk.blue("\n💰 Testing Profit Calculation Endpoints...\n"));

    const tradeOpId = "test-trade-op-001";

    // Calculate profit
    const calculateResult = await this.runTest(
      "GET",
      `/api/profit/${tradeOpId}/calculate`,
    );
    this.results.push(calculateResult);
    this.printResult(calculateResult);

    // Calculate impact
    const impactResult = await this.runTest(
      "POST",
      `/api/profit/${tradeOpId}/impact`,
      {
        newPrice: 375,
        quantity: 100,
        offerType: "BUYER",
      },
    );
    this.results.push(impactResult);
    this.printResult(impactResult);

    // Optimize profit
    const optimizeResult = await this.runTest(
      "POST",
      `/api/profit/${tradeOpId}/optimize`,
      {
        targetMargin: 8,
        constraints: {
          maxBuyerPrice: 380,
          minSellerPrice: 340,
          maxTransportCost: 15,
        },
      },
    );
    this.results.push(optimizeResult);
    this.printResult(optimizeResult);

    // Validate margins
    const validateResult = await this.runTest(
      "POST",
      "/api/profit/validate-margins",
      {
        operations: [
          {
            tradeOperationId: "trade-op-001",
            sellingPrice: 375,
            purchasePrice: 350,
            transportCost: 10,
            quantity: 100,
          },
        ],
      },
    );
    this.results.push(validateResult);
    this.printResult(validateResult);

    // Get benchmarks
    const benchmarksResult = await this.runTest(
      "GET",
      "/api/profit/benchmarks",
    );
    this.results.push(benchmarksResult);
    this.printResult(benchmarksResult);
  }

  // Transport Tests
  async testTransport() {
    console.log(chalk.blue("\n🚚 Testing Transport Endpoints...\n"));

    // Calculate transport costs
    const calculateResult = await this.runTest(
      "POST",
      "/api/transport/calculate-cost",
      {
        origin: { lat: 42.6977, lng: 23.3219 },
        destination: { lat: 42.1354, lng: 24.7453 },
        quantity: 100,
        vehicleType: "TRUCK",
      },
    );
    this.results.push(calculateResult);
    this.printResult(calculateResult);

    // Optimize route
    const optimizeResult = await this.runTest(
      "POST",
      "/api/transport/optimize-route",
      {
        origin: { lat: 42.6977, lng: 23.3219 },
        destinations: [
          { lat: 42.1354, lng: 24.7453, quantity: 50 },
          { lat: 43.2141, lng: 27.9147, quantity: 50 },
        ],
        algorithm: "TSP_NEAREST",
      },
    );
    this.results.push(optimizeResult);
    this.printResult(optimizeResult);

    // Get transport settings
    const settingsResult = await this.runTest("GET", "/api/transport/settings");
    this.results.push(settingsResult);
    this.printResult(settingsResult);

    // Update transport settings
    const updateSettingsResult = await this.runTest(
      "PUT",
      "/api/transport/settings",
      {
        baseCostPerKm: 2.5,
        fuelSurchargePercent: 15,
        loadingTimeMinutes: 45,
        unloadingTimeMinutes: 30,
      },
    );
    this.results.push(updateSettingsResult);
    this.printResult(updateSettingsResult);
  }

  // Negotiation Tests
  async testNegotiations() {
    console.log(chalk.blue("\n🤝 Testing Negotiation Endpoints...\n"));

    const tradeOpId = "test-trade-op-001";

    // Submit buyer offer
    const buyerOfferResult = await this.runTest(
      "POST",
      "/api/negotiations/buyer-offer",
      {
        tradeOperationId: tradeOpId,
        price: 375,
        quantity: 100,
        terms: "Payment on delivery",
      },
    );
    this.results.push(buyerOfferResult);
    this.printResult(buyerOfferResult);

    // Submit seller offer
    const sellerOfferResult = await this.runTest(
      "POST",
      "/api/negotiations/seller-offer",
      {
        tradeSellerId: "test-trade-seller-001",
        price: 345,
        quantity: 50,
        response: "COUNTER",
        responseNote: "Can accept 350 for immediate payment",
      },
    );
    this.results.push(sellerOfferResult);
    this.printResult(sellerOfferResult);

    // Bulk negotiate
    const bulkNegotiateResult = await this.runTest(
      "POST",
      "/api/negotiations/bulk-negotiate",
      {
        tradeOperationId: tradeOpId,
        buyerOffer: { price: 375, quantity: 100 },
        sellerOffers: [
          { tradeSellerId: "seller-001", price: 345, quantity: 50 },
          { tradeSellerId: "seller-002", price: 348, quantity: 50 },
        ],
      },
    );
    this.results.push(bulkNegotiateResult);
    this.printResult(bulkNegotiateResult);

    // Get price suggestions
    const suggestionsResult = await this.runTest(
      "GET",
      `/api/negotiations/trade/${tradeOpId}/suggest-prices`,
    );
    this.results.push(suggestionsResult);
    this.printResult(suggestionsResult);

    // Get negotiation summary
    const summaryResult = await this.runTest(
      "GET",
      `/api/negotiations/trade/${tradeOpId}/summary`,
    );
    this.results.push(summaryResult);
    this.printResult(summaryResult);
  }

  // Scenario Tests
  async testScenarios() {
    console.log(chalk.blue("\n🎯 Testing Scenario Endpoints...\n"));

    const tradeOpId = "test-trade-op-001";

    // Create scenario
    const createResult = await this.runTest(
      "POST",
      `/api/scenarios/${tradeOpId}/create`,
      {
        name: "Best Case Scenario",
        assumptions: {
          buyerPrice: 380,
          sellerPrices: [340, 342],
          transportCost: 10,
        },
      },
    );
    this.results.push(createResult);
    this.printResult(createResult);

    // Compare scenarios
    const compareResult = await this.runTest(
      "POST",
      `/api/scenarios/${tradeOpId}/compare`,
      {
        scenarios: [
          {
            name: "Conservative",
            buyerPrice: 370,
            avgSellerPrice: 350,
            transportCost: 12,
          },
          {
            name: "Optimistic",
            buyerPrice: 380,
            avgSellerPrice: 345,
            transportCost: 10,
          },
        ],
      },
    );
    this.results.push(compareResult);
    this.printResult(compareResult);

    // Run Monte Carlo simulation
    const monteCarloResult = await this.runTest(
      "POST",
      `/api/scenarios/${tradeOpId}/monte-carlo`,
      {
        iterations: 1000,
        priceRanges: {
          buyer: { min: 365, max: 385 },
          seller: { min: 340, max: 355 },
          transport: { min: 8, max: 15 },
        },
      },
    );
    this.results.push(monteCarloResult);
    this.printResult(monteCarloResult);

    // Get risk assessment
    const riskResult = await this.runTest(
      "GET",
      `/api/scenarios/${tradeOpId}/risk-assessment`,
    );
    this.results.push(riskResult);
    this.printResult(riskResult);
  }

  // Helper to print test results
  private printResult(result: TestResult) {
    const statusIcon = result.status === "PASS" ? "✅" : "❌";
    const statusColor = result.status === "PASS" ? chalk.green : chalk.red;

    console.log(
      `${statusIcon} ${chalk.bold(result.method)} ${result.endpoint}`,
      statusColor(`[${result.status}]`),
      result.responseTime ? chalk.gray(`${result.responseTime}ms`) : "",
    );

    if (result.error) {
      console.log(chalk.red(`   Error: ${result.error}`));
    }

    if (result.status === "PASS" && result.data) {
      // Show key data points
      if (result.data.profitMargin !== undefined) {
        console.log(
          chalk.gray(`   Profit Margin: ${result.data.profitMargin}%`),
        );
      }
      if (result.data.estimatedProfit !== undefined) {
        console.log(
          chalk.gray(`   Estimated Profit: €${result.data.estimatedProfit}`),
        );
      }
      if (result.data.viability !== undefined) {
        console.log(chalk.gray(`   Viability: ${result.data.viability}`));
      }
    }
  }

  // Generate summary report
  private generateSummary() {
    console.log(chalk.blue("\n📈 Test Summary\n"));

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const total = this.results.length;

    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(`Pass Rate: ${passRate}%`);

    // Average response time
    const times = this.results
      .filter((r) => r.responseTime)
      .map((r) => r.responseTime!);

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Average Response Time: ${avgTime.toFixed(0)}ms`);
    }

    // Failed endpoints
    if (failed > 0) {
      console.log(chalk.red("\n❌ Failed Endpoints:"));
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`  - ${r.method} ${r.endpoint}`);
          if (r.error) {
            console.log(chalk.gray(`    ${r.error}`));
          }
        });
    }

    // Performance warnings
    const slowEndpoints = this.results.filter(
      (r) => r.responseTime && r.responseTime > 1000,
    );
    if (slowEndpoints.length > 0) {
      console.log(chalk.yellow("\n⚠️  Slow Endpoints (>1s):"));
      slowEndpoints.forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.responseTime}ms)`);
      });
    }
  }

  // Main test runner
  async runAllTests() {
    console.log(chalk.bold.blue("🚀 Starting API Test Suite"));
    console.log(chalk.gray(`Base URL: ${BASE_URL}`));
    console.log(chalk.gray(`Time: ${new Date().toISOString()}\n`));

    // Check server health first
    const healthResult = await this.runTest("GET", "/health");
    if (healthResult.status === "FAIL") {
      console.log(
        chalk.red(
          "\n⚠️  Server is not responding. Please ensure the backend is running.",
        ),
      );
      console.log(chalk.yellow("Run: cd backend && npm run start:dev"));
      return;
    }

    // Run test suites
    await this.testTradeOperations();
    await this.testProfitCalculations();
    await this.testTransport();
    await this.testNegotiations();
    await this.testScenarios();

    // Generate summary
    this.generateSummary();

    // Exit code based on results
    const hasFailures = this.results.some((r) => r.status === "FAIL");
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run tests
const runner = new APITestRunner();
runner.runAllTests().catch((error) => {
  console.error(chalk.red("Test runner failed:"), error);
  process.exit(1);
});
