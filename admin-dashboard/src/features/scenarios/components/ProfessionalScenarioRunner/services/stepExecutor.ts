import { simulationApi } from '../../../../../services/simulationApi';
import { scenarioContext } from '../../../../../services/scenarioContext';
import type { ScenarioStep } from '../../../../../types/scenario';

export interface StepExecutionResult {
  result: any;
  duration: number;
}

export class StepExecutor {
  async execute(step: ScenarioStep): Promise<StepExecutionResult> {
    const startTime = Date.now();
    let result;

    // Get the data/payload (normalize field name)
    const stepData = step.data || step.payload;

    // Execute based on action type - simplified with context manager
    switch (step.action) {
      case 'createTestUser':
        // API expects (role, name, data) as separate params
        result = await simulationApi.createTestUser(
          stepData.role,
          stepData.name,
          stepData.data
        );
        // Store in context
        scenarioContext.addUser(result.role, result);
        break;

      case 'createSaleListing':
      case 'createSellListing':
      case 'createFarmerSaleListing':
        // simulationApi.createSaleListing now handles context resolution
        result = await simulationApi.createSaleListing(stepData);
        break;

      case 'createBuyListing':
        result = await simulationApi.createBuyListing(stepData);
        break;

      case 'createTradeOperation':
        result = await simulationApi.createTradeOperation(stepData);
        break;

      case 'sendNegotiation':
      case 'buyerInitiateNegotiation':
      case 'sendOffers':
        result = await simulationApi.initiateNegotiation(stepData);
        break;

      case 'sellerAcceptOffer':
      case 'acceptNegotiation':
      case 'acceptOffer':
      case 'farmerAccept':
        result = await simulationApi.respondToNegotiation({
          ...stepData,
          response: 'accept'
        });
        break;

      case 'farmerReject':
        result = await simulationApi.respondToNegotiation({
          ...stepData,
          response: 'reject'
        });
        break;

      case 'farmerCounter':
        result = await simulationApi.respondToNegotiation({
          ...stepData,
          response: 'counter'
        });
        break;

      case 'requestInspection':
      case 'assignInspector':
        result = await simulationApi.requestInspection(stepData);
        break;

      case 'submitInspection':
      case 'submitResults':
      case 'inspectorVerify':
        result = await simulationApi.submitInspection({
          ...stepData,
          result: 'PASSED'
        });
        break;

      case 'inspectorFail':
        result = await simulationApi.submitInspection({
          ...stepData,
          result: 'FAILED'
        });
        break;

      case 'createTransportRequest':
      case 'createTransport':
        result = await simulationApi.createTransportRequest(stepData);
        break;

      case 'transporterSubmitBid':
      case 'submitTransportBid':
      case 'transporterBid':
        result = await simulationApi.submitTransportBid(stepData);
        break;

      case 'adminSelectBid':
      case 'selectTransportBid':
      case 'acceptBid':
      case 'acceptTransportBid':
        result = await simulationApi.acceptTransportBid(stepData);
        break;

      case 'transporterStartJob':
      case 'startTransport':
        const transporter = scenarioContext.getUser('TRANSPORTER', stepData.transporterIndex || 0);
        const job = scenarioContext.getLatestEntity('transportJobs');
        if (transporter && job) {
          result = await simulationApi.transporter.startJob(transporter.id, job.id);
        } else {
          throw new Error('Transporter or job not found in context');
        }
        break;

      case 'transporterComplete':
      case 'completeDelivery':
      case 'transporterDeliver':
      case 'markDelivered':
        const transporter2 = scenarioContext.getUser('TRANSPORTER', stepData.transporterIndex || 0);
        const job2 = scenarioContext.getLatestEntity('transportJobs');
        if (transporter2 && job2) {
          result = await simulationApi.transporter.completeDelivery(
            transporter2.id,
            job2.id,
            stepData.notes || 'Delivery completed successfully'
          );
        } else {
          throw new Error('Transporter or job not found in context');
        }
        break;

      case 'completeTrade':
      case 'finalizeTrade':
      case 'closeTrade':
        const tradeOp = scenarioContext.getCurrentTradeOperation();
        if (tradeOp) {
          result = await simulationApi.admin.completeTrade(tradeOp.id);
        } else {
          throw new Error('Trade operation not found in context');
        }
        break;

      // Additional dispute and resolution actions
      case 'raiseDispute':
      case 'reportIssue':
        result = { message: `Dispute raised: ${stepData?.reason || 'Quality issue'}` };
        break;

      case 'resolveDispute':
      case 'adminResolve':
        result = { message: 'Dispute resolved by admin' };
        break;

      // Buyer-specific actions
      case 'buyerAccept':
        result = await simulationApi.respondToNegotiation({
          ...stepData,
          response: 'accept'
        });
        break;

      case 'buyerReject':
        result = await simulationApi.respondToNegotiation({
          ...stepData,
          response: 'reject'
        });
        break;

      // Admin intervention actions
      case 'adminIntervene':
      case 'adminFindSellers':
      case 'adminSourceMore':
        result = { message: 'Admin intervention completed' };
        break;

      default:
        console.warn(`Unhandled action: ${step.action}`, stepData);
        result = { message: `Action ${step.action} executed (simulated)` };
    }

    const duration = Date.now() - startTime;
    return { result, duration };
  }
}

export const stepExecutor = new StepExecutor();
