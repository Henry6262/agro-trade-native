export class CreateEscrowDto {
  tradeOperationId: string;
  buyerAddress: string;
  sellerAddress: string;
  amountEth: string; // Amount in ETH as string e.g. "0.1"
  chain?: "CELO" | "SOLANA";
}

export class EscrowActionDto {
  tradeOperationId: string;
  escrowKey: string;
}

export class ResolveDisputeDto {
  releaseToBuyer: boolean;
}
