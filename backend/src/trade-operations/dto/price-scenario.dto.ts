import {
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsNotEmpty,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ScenarioGenerationRequestDto {
  @ApiProperty({
    description: "Trade operation ID",
    example: "cmf896m430000md43fpxv05x8",
  })
  @IsString()
  @IsNotEmpty()
  tradeOperationId: string;

  @ApiPropertyOptional({
    description: "Price variance percentage (0.1 = 10%)",
    example: 0.1,
    minimum: 0,
    maximum: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.5)
  priceVariance?: number;

  @ApiPropertyOptional({
    description: "Number of scenarios to generate",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  scenarioCount?: number;

  @ApiPropertyOptional({
    description: "Include quality factors in scenarios",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeQualityFactors?: boolean;

  @ApiPropertyOptional({
    description: "Include transport cost variations",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTransportVariations?: boolean;

  @ApiPropertyOptional({
    description: "Minimum acceptable profit margin",
    example: 5,
    minimum: 0,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  minProfitMargin?: number;
}

export class SellerPriceScenarioDto {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
  sellerId: string;

  @ApiProperty({ example: "John Farm" })
  sellerName: string;

  @ApiProperty({ example: 345 })
  price: number;

  @ApiProperty({ example: 50 })
  quantity: number;

  @ApiProperty({ example: "STANDARD" })
  quality: string;
}

export class PriceScenarioDto {
  @ApiProperty({ example: "scenario_1" })
  id: string;

  @ApiProperty({ example: 378 })
  buyerPrice: number;

  @ApiProperty({ type: [SellerPriceScenarioDto] })
  sellerPrices: SellerPriceScenarioDto[];

  @ApiProperty({ example: 155 })
  transportCost: number;

  @ApiProperty({ example: 2650 })
  estimatedProfit: number;

  @ApiProperty({ example: 6.97 })
  profitMargin: number;

  @ApiProperty({ example: 38000 })
  totalRevenue: number;

  @ApiProperty({ example: 35350 })
  totalCosts: number;

  @ApiProperty({
    enum: ["HIGH", "MEDIUM", "LOW", "UNVIABLE"],
    example: "MEDIUM",
  })
  viability: "HIGH" | "MEDIUM" | "LOW" | "UNVIABLE";

  @ApiProperty({ example: 75.5 })
  acceptanceProbability: number;

  @ApiProperty({ example: 1 })
  rank: number;
}

export class ScenarioStatisticsDto {
  @ApiProperty({ example: 7.2 })
  averageMargin: number;

  @ApiProperty({ example: 7.0 })
  medianMargin: number;

  @ApiProperty({ example: 7 })
  viableCount: number;

  @ApiProperty({ example: 3 })
  unviableCount: number;

  @ApiProperty({ example: 3500 })
  maxProfit: number;

  @ApiProperty({ example: -500 })
  minProfit: number;

  @ApiProperty({
    enum: ["LOW", "MEDIUM", "HIGH"],
    example: "LOW",
  })
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export class ScenarioAnalysisResponseDto {
  @ApiProperty({ type: [PriceScenarioDto] })
  scenarios: PriceScenarioDto[];

  @ApiProperty({ type: PriceScenarioDto })
  optimal: PriceScenarioDto;

  @ApiProperty({ type: ScenarioStatisticsDto })
  statistics: ScenarioStatisticsDto;

  @ApiProperty({
    type: "array",
    items: { type: "string" },
    example: [
      "Average margin 7.2% meets target 7%",
      "Optimal scenario offers 7.5% margin with 82% acceptance probability",
    ],
  })
  recommendations: string[];
}

export class SensitivityAnalysisRequestDto {
  @ApiProperty({
    description: "Trade operation ID",
    example: "cmf896m430000md43fpxv05x8",
  })
  @IsString()
  @IsNotEmpty()
  tradeOperationId: string;

  @ApiProperty({
    description: "Base seller prices for analysis",
    type: "array",
    items: {
      type: "object",
      properties: {
        sellerId: { type: "string" },
        price: { type: "number" },
        quantity: { type: "number" },
      },
    },
  })
  baseSellerPrices: Array<{
    sellerId: string;
    price: number;
    quantity: number;
  }>;

  @ApiPropertyOptional({
    description: "Number of price points to analyze",
    example: 20,
    minimum: 5,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  pricePoints?: number;
}

export class PricePointDto {
  @ApiProperty({ example: 360 })
  buyerPrice: number;

  @ApiProperty({ example: 5.5 })
  profitMargin: number;

  @ApiProperty({ example: true })
  viability: boolean;
}

export class SensitivityAnalysisResponseDto {
  @ApiProperty({ type: [PricePointDto] })
  pricePoints: PricePointDto[];

  @ApiProperty({ example: 352 })
  breakEvenPrice: number;

  @ApiProperty({ example: 378 })
  targetMarginPrice: number;

  @ApiProperty({ example: 400 })
  maxAcceptablePrice: number;

  @ApiProperty({ example: 1.5 })
  elasticity: number;

  @ApiPropertyOptional({
    type: "object",
    properties: {
      optimalRange: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
        },
      },
      riskZones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            range: { type: "string" },
            risk: { type: "string" },
            description: { type: "string" },
          },
        },
      },
    },
  })
  analysis?: {
    optimalRange: {
      min: number;
      max: number;
    };
    riskZones: Array<{
      range: string;
      risk: "LOW" | "MEDIUM" | "HIGH";
      description: string;
    }>;
  };
}

export class StrategyComparisonRequestDto {
  @ApiProperty({
    description: "Trade operation ID",
    example: "cmf896m430000md43fpxv05x8",
  })
  @IsString()
  @IsNotEmpty()
  tradeOperationId: string;

  @ApiProperty({
    description: "Strategies to compare",
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        params: { type: "object" },
      },
    },
  })
  strategies: Array<{
    name: string;
    params: Partial<ScenarioGenerationRequestDto>;
  }>;
}

export class StrategyResultDto {
  @ApiProperty({ example: "Conservative" })
  strategy: string;

  @ApiProperty({ type: PriceScenarioDto })
  bestScenario: PriceScenarioDto;

  @ApiProperty({ example: 6.8 })
  averageMargin: number;

  @ApiProperty({ example: 70 })
  viablePercentage: number;
}

export class StrategyComparisonResponseDto {
  @ApiProperty({ type: [StrategyResultDto] })
  comparison: StrategyResultDto[];

  @ApiProperty({ example: "Balanced" })
  winner: string;

  @ApiPropertyOptional({
    type: "object",
    properties: {
      bestForProfit: { type: "string" },
      bestForRisk: { type: "string" },
      bestForAcceptance: { type: "string" },
    },
  })
  insights?: {
    bestForProfit: string;
    bestForRisk: string;
    bestForAcceptance: string;
  };
}

export class QuickEstimateDto {
  @ApiProperty({
    description: "Product ID",
    example: "cmf896m430000md43fpxv05x8",
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: "Buyer price per unit",
    example: 380,
  })
  @IsNumber()
  @Min(0)
  buyerPrice: number;

  @ApiProperty({
    description: "Average seller price per unit",
    example: 350,
  })
  @IsNumber()
  @Min(0)
  avgSellerPrice: number;

  @ApiProperty({
    description: "Quantity in tons",
    example: 100,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: "Estimated transport distance in km",
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportDistance?: number;
}

export class QuickEstimateResponseDto {
  @ApiProperty({ example: 38000 })
  revenue: number;

  @ApiProperty({ example: 35000 })
  purchaseCost: number;

  @ApiProperty({ example: 150 })
  transportCost: number;

  @ApiProperty({ example: 2850 })
  estimatedProfit: number;

  @ApiProperty({ example: 7.5 })
  profitMargin: number;

  @ApiProperty({ example: true })
  isViable: boolean;

  @ApiProperty({
    type: "object",
    properties: {
      minSellerPrice: { type: "number" },
      maxSellerPrice: { type: "number" },
      targetSellerPrice: { type: "number" },
    },
  })
  priceGuidance: {
    minSellerPrice: number;
    maxSellerPrice: number;
    targetSellerPrice: number;
  };
}
