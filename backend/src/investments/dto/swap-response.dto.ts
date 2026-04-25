import { InvestmentStatus } from "@prisma/client";

export class SwapResponseDto {
  positionId: string;
  status: InvestmentStatus;
  txSignature: string | null;
}
