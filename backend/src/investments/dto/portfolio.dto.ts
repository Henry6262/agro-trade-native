import { InvestmentStatus } from "@prisma/client";

export class PortfolioPositionDto {
  id: string;
  tradeOperationId: string | null;
  assetSymbol: string;
  amountUsdc: string;
  tokenAmount: string;
  inputMint: string;
  outputMint: string;
  txSignature: string | null;
  status: InvestmentStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
