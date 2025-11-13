export type InspectionCompletionMode = 'PASS' | 'FAIL';

export interface InspectionCompletionContext {
  inspectionId: string;
  sellerName?: string;
  productName?: string;
  address?: string;
  quantity?: number;
  unit?: string;
}
