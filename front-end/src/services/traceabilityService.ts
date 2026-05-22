export const traceabilityService = {
  getQRUrl: (tradeOperationId: string): string => `https://agrotrade.bg/verify/${tradeOperationId}`,
};
