export class CreateEscrowDto {
  tradeOperationId: string;
  buyerAddress: string;
  sellerAddress: string;
  amountEth: string; // Amount in ETH as string e.g. "0.1"
}

export class EscrowActionDto {
  tradeOperationId: string;
  escrowKey: string;
}

export class ResolveDisputeDto {
  releaseToBuyer: boolean;
}
