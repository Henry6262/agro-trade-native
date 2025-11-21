import { scenarioContext } from './scenarioContext';
import { authService } from './api/authService';
import { buyerService } from './api/buyerService';
import { sellerService } from './api/sellerService';
import { transporterService } from './api/transporterService';
import { inspectorService } from './api/inspectorService';
import { adminService } from './api/adminService';
import { userService } from './api/userService';
import { scenarioHelpers } from './api/scenarioHelpers';

// Re-export types for backward compatibility
export type { UserRole, SimulationUser, TradeState } from './api/types';

// Main simulation API - aggregates all services for convenient access
export const simulationApi = {
  // ==================== Authentication ====================
  login: authService.login,
  auth: authService,

  // ==================== State Queries ====================
  getUsersByRole: userService.getUsersByRole,
  getFullTradeState: userService.getFullTradeState,
  createTestUser: userService.createTestUser,

  // ==================== Buyer Actions ====================
  buyer: buyerService,

  // ==================== Seller Actions ====================
  seller: sellerService,

  // ==================== Transporter Actions ====================
  transporter: transporterService,

  // ==================== Inspector Actions ====================
  inspector: inspectorService,

  // ==================== Admin Workflow Actions ====================
  admin: adminService,

  // ==================== Convenience Methods for Scenarios ====================
  createSaleListing: scenarioHelpers.createSaleListing,
  createBuyListing: scenarioHelpers.createBuyListing,
  createTradeOperation: scenarioHelpers.createTradeOperation,
  initiateNegotiation: scenarioHelpers.initiateNegotiation,
  respondToNegotiation: scenarioHelpers.respondToNegotiation,
  requestInspection: scenarioHelpers.requestInspection,
  submitInspection: scenarioHelpers.submitInspection,
  createTransportRequest: scenarioHelpers.createTransportRequest,
  submitTransportBid: scenarioHelpers.submitTransportBid,
  acceptTransportBid: scenarioHelpers.acceptTransportBid,
  cleanupTestData: scenarioHelpers.cleanupTestData,
};

// Export scenarioContext for external access
export { scenarioContext };
