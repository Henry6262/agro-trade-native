import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';
import type { TradeOperation, Offer } from '../../../../types/listings';
import {
  validateWorkflowComplete,
  calculateInspectionSummary,
  calculateTransportSummary,
  calculateQuantitySummary,
  calculateFinancialSummary,
  formatCurrency,
  formatPercentage,
  type WorkflowValidationResult,
  type InspectionSummary,
  type TransportSummary,
  type QuantitySummary,
  type FinancialSummary,
} from '../../../../utils/workflowValidation';
import { AnimatedNumber, Confetti, EnhancedTooltip } from '../../../../components/common';

interface TradeFinalizationPanelProps {
  tradeOperationId: string;
  operation: TradeOperation;
  inspections: any[];
  transportData: any | null;
  onFinalized: () => void;
}

export const TradeFinalizationPanel: React.FC<TradeFinalizationPanelProps> = ({
  tradeOperationId,
  operation,
  inspections,
  transportData,
  onFinalized,
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate summaries
  const inspectionSummary: InspectionSummary = calculateInspectionSummary(inspections);
  const transportSummary: TransportSummary = calculateTransportSummary(transportData);
  const quantitySummary: QuantitySummary = calculateQuantitySummary(
    operation.buyListing?.quantity || 0,
    operation.offers || []
  );

  // Validate workflow
  const validation: WorkflowValidationResult = validateWorkflowComplete(
    operation,
    inspectionSummary,
    transportSummary,
    quantitySummary
  );

  // Calculate financial summary
  const financialSummary: FinancialSummary = calculateFinancialSummary(
    operation,
    transportData?.request?.estimatedCost || 0
  );

  const transportRequest = transportData?.request ?? null;
  const transportJob = transportData?.job ?? null;
  const transportBidsCount =
    transportRequest?.bids?.length ??
    transportData?.bids?.length ??
    0;
  const transportStatusLabel = transportSummary.status
    ? transportSummary.status.replace(/_/g, ' ')
    : null;
  const proofReference = transportJob?.proofOfDelivery || null;
  const deliveryPhotosCount = Array.isArray(transportJob?.deliveryPhotos)
    ? transportJob.deliveryPhotos.length
    : 0;

  // Determine overall progress
  const progressSteps = [
    { label: 'Offers Accepted', completed: validation.hasAcceptedOffers },
    { label: 'Inspections Complete', completed: validation.inspectionsComplete },
    { label: 'Transport Complete', completed: validation.transportComplete },
    { label: 'Quantity Fulfilled', completed: validation.quantityFulfilled },
  ];
  const completedSteps = progressSteps.filter(s => s.completed).length;
  const overallProgress = (completedSteps / progressSteps.length) * 100;

  const handleFinalize = async () => {
    if (!validation.canFinalize) {
      toast({
        variant: 'destructive',
        title: 'Cannot Finalize',
        description: 'Please resolve all blockers before finalizing',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Update operation status to COMPLETED
      await api.patch(API_ENDPOINTS.tradeOperations.byId(tradeOperationId), {
        status: 'COMPLETED',
        phase: 'COMPLETED',
      });

      setShowConfirmation(false);
      setShowSuccessDialog(true);

      // Notify parent component after confetti
      setTimeout(() => {
        onFinalized();
      }, 3000);
    } catch (err) {
      console.error('Error finalizing trade:', err);
      setError('Failed to finalize trade operation. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Finalization Failed',
        description: 'An error occurred while finalizing the trade operation',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (completed: boolean) => {
    return completed ? (
      <span className="text-green-600 text-xl">✓</span>
    ) : (
      <span className="text-gray-400 text-xl">○</span>
    );
  };

  // Don't show if already completed
  if (operation.status === 'COMPLETED') {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-br from-green-50 to-green-100 border-b-2 border-green-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <CardTitle>Trade Completed</CardTitle>
              <CardDescription>This trade operation has been successfully finalized</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center">
            <span className="text-6xl mb-4 block">🎉</span>
            <h3 className="text-xl font-bold text-green-900 mb-2">Operation Complete!</h3>
            <p className="text-green-800">
              Trade operation #{operation.operationNumber} has been successfully completed and finalized.
            </p>
            {financialSummary.hasData && (
              <div className="mt-6 pt-6 border-t border-green-200">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-green-700 mb-1">Final Revenue</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(financialSummary.sellerRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 mb-1">Total Profit</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(financialSummary.estimatedProfit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 mb-1">Profit Margin</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatPercentage(financialSummary.profitMargin)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Confetti active={showSuccessDialog} duration={3000} />
      <Card>
        <CardHeader className="bg-gradient-to-br from-violet-50 to-violet-100 border-b-2 border-violet-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <div>
                <CardTitle>Trade Finalization</CardTitle>
                <CardDescription>Complete the trade operation workflow</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-violet-700 mb-1">Overall Progress</p>
              <p className="text-2xl font-bold text-violet-900">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Progress Bar */}
            <div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-text-secondary mt-2 text-center">
                {completedSteps} of {progressSteps.length} steps completed
              </p>
            </div>

            {/* Completion Checklist */}
            <div>
              <h3 className="text-sm font-bold text-text-secondary mb-3">WORKFLOW CHECKLIST</h3>
              <div className="space-y-2">
                {progressSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                      step.completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(step.completed)}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${step.completed ? 'text-green-900' : 'text-gray-700'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            {financialSummary.hasData && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-sm font-bold text-blue-900 mb-3">FINANCIAL SUMMARY</h3>
                <div className="grid grid-cols-2 gap-4">
                  <EnhancedTooltip content="Total cost of purchasing goods from sellers">
                    <div className="hover:bg-blue-50 p-2 rounded transition-colors cursor-help">
                      <p className="text-xs text-blue-700 mb-1">Purchase Cost</p>
                      <p className="text-lg font-bold text-blue-900">
                        <AnimatedNumber value={financialSummary.totalPurchaseCost} decimals={2} prefix="€" />
                      </p>
                    </div>
                  </EnhancedTooltip>
                  <EnhancedTooltip content="Total cost of transport services">
                    <div className="hover:bg-blue-50 p-2 rounded transition-colors cursor-help">
                      <p className="text-xs text-blue-700 mb-1">Transport Cost</p>
                      <p className="text-lg font-bold text-blue-900">
                        <AnimatedNumber value={financialSummary.totalTransportCost} decimals={2} prefix="€" />
                      </p>
                    </div>
                  </EnhancedTooltip>
                  <EnhancedTooltip content="Combined purchase and transport costs">
                    <div className="hover:bg-blue-50 p-2 rounded transition-colors cursor-help">
                      <p className="text-xs text-blue-700 mb-1">Total Cost</p>
                      <p className="text-lg font-bold text-blue-900">
                        <AnimatedNumber value={financialSummary.totalOperationalCost} decimals={2} prefix="€" />
                      </p>
                    </div>
                  </EnhancedTooltip>
                  <EnhancedTooltip content="Expected revenue from buyer">
                    <div className="hover:bg-blue-50 p-2 rounded transition-colors cursor-help">
                      <p className="text-xs text-blue-700 mb-1">Revenue</p>
                      <p className="text-lg font-bold text-blue-900">
                        <AnimatedNumber value={financialSummary.sellerRevenue} decimals={2} prefix="€" />
                      </p>
                    </div>
                  </EnhancedTooltip>
                  <div className="col-span-2 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-blue-700 mb-1">Estimated Profit</p>
                        <p className={`text-2xl font-bold ${financialSummary.estimatedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          <AnimatedNumber value={financialSummary.estimatedProfit} decimals={2} prefix="€" duration={1500} />
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-blue-700 mb-1">Margin</p>
                        <p className={`text-2xl font-bold ${financialSummary.profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          <AnimatedNumber value={financialSummary.profitMargin} decimals={1} suffix="%" duration={1500} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transport Status */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">TRANSPORT STATUS</h3>
                {transportStatusLabel && (
                  <Badge variant="outline" className="uppercase tracking-wide text-xs">
                    {transportStatusLabel}
                  </Badge>
                )}
              </div>
              {!transportRequest ? (
                <p className="text-sm text-slate-600">
                  Transport request has not been created yet. Create a request from the transport tab to continue.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Request</p>
                    <p className="font-semibold text-slate-900">
                      #{transportRequest.requestNumber || '—'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(transportRequest.status || 'UNKNOWN').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Bids Received</p>
                    <p className="font-semibold text-slate-900">{transportBidsCount}</p>
                    {transportRequest.status === 'OPEN' && transportBidsCount === 0 && (
                      <p className="text-xs text-amber-600 mt-1">Awaiting transporter bids</p>
                    )}
                  </div>
                  {transportJob ? (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Job</p>
                        <p className="font-semibold text-slate-900">
                          #{transportJob.jobNumber || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(transportJob.status || 'UNKNOWN').replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Proof of Delivery</p>
                        <p
                          className={`font-semibold ${
                            transportSummary.hasDeliveryProof ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {transportSummary.hasDeliveryProof ? 'Uploaded' : 'Missing'}
                        </p>
                        {proofReference && (
                          <p className="text-xs text-slate-500 truncate">
                            Ref: {proofReference}
                          </p>
                        )}
                        {!transportSummary.hasDeliveryProof && transportSummary.isComplete && (
                          <p className="text-xs text-rose-500 mt-1">
                            Upload signature or delivery photos to unblock finalization.
                          </p>
                        )}
                        {deliveryPhotosCount > 0 && (
                          <p className="text-xs text-slate-500">
                            {deliveryPhotosCount} delivery photo{deliveryPhotosCount === 1 ? '' : 's'}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-xs text-slate-500">
                      Assign a transporter and generate a transport job to capture delivery proof.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Blockers */}
            {validation.blockers.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-red-900 text-sm mb-2">Cannot Finalize - Blockers Present</p>
                    <ul className="space-y-1">
                      {validation.blockers.map((blocker, index) => (
                        <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && validation.blockers.length === 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-xl flex-shrink-0">⚡</span>
                  <div>
                    <p className="font-bold text-yellow-900 text-sm mb-2">Warnings</p>
                    <ul className="space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                          <span className="text-yellow-600 mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Ready to Finalize */}
            {validation.canFinalize && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-2xl flex-shrink-0">✨</span>
                  <div>
                    <p className="font-bold text-green-900 text-sm">Ready for Finalization</p>
                    <p className="text-sm text-green-800 mt-1">
                      All workflow requirements have been met. You can now finalize this trade operation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-xl flex-shrink-0">❌</span>
                  <div>
                    <p className="font-bold text-red-900 text-sm">Error</p>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={!validation.canFinalize || isProcessing}
                className="bg-violet-600 hover:bg-violet-700 text-white"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Finalizing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Finalize Trade Operation
                  </>
                )}
              </Button>

              {!validation.canFinalize && (
                <div className="text-sm text-text-secondary">
                  Resolve blockers to enable finalization
                </div>
              )}

              {validation.canFinalize && validation.warnings.length > 0 && (
                <div className="text-sm text-yellow-700">
                  {validation.warnings.length} warning(s) - review before finalizing
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Trade Operation?</DialogTitle>
            <DialogDescription>
              This action will mark the trade operation as COMPLETED and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Operation Summary</p>
              <div className="space-y-1 text-sm">
                <p className="text-blue-800">
                  <span className="font-medium">Operation:</span> #{operation.operationNumber}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Quantity Fulfilled:</span> {quantitySummary.fulfilled}{operation.buyListing?.unit}
                </p>
                {financialSummary.hasData && (
                  <>
                    <p className="text-blue-800">
                      <span className="font-medium">Total Cost:</span> {formatCurrency(financialSummary.totalOperationalCost)}
                    </p>
                    <p className="text-blue-800">
                      <span className="font-medium">Estimated Profit:</span> {formatCurrency(financialSummary.estimatedProfit)}
                    </p>
                  </>
                )}
              </div>
            </div>
            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Review Warnings:</p>
                <ul className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-800">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isProcessing}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                'Confirm Finalization'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Trade Operation Finalized!</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <span className="text-7xl block mb-4 animate-bounce">🎉</span>
            <p className="text-xl font-bold text-green-900 mb-2">
              Operation #{operation.operationNumber} Complete
            </p>
            <p className="text-text-secondary">
              The trade operation has been successfully finalized and marked as COMPLETED.
            </p>
            {financialSummary.hasData && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700 font-semibold">Final Profit</p>
                    <p className="text-2xl font-bold text-green-900">
                      <AnimatedNumber value={financialSummary.estimatedProfit} decimals={2} prefix="€" duration={2000} />
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700 font-semibold">Margin</p>
                    <p className="text-2xl font-bold text-green-900">
                      <AnimatedNumber value={financialSummary.profitMargin} decimals={1} suffix="%" duration={2000} />
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg"
              size="lg"
            >
              Celebrate! 🎊
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TradeFinalizationPanel;
