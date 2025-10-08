# Scenario Orchestrator - Admin Dashboard

## Overview

The Scenario Orchestrator is a powerful admin tool for simulating complete trade workflows in the Agro-Trade platform. It allows administrators to create test users, execute predefined scenarios, and observe the entire trade lifecycle from seller matching to delivery.

## Access

**URL**: http://localhost:5173 (in development)

**Navigation**: Click the "Scenarios" tab in the admin dashboard header

**Login Credentials**:
- Email: `test-admin@agrotrade.com`
- Password: `admin123`

## Features

### 1. User Management
- Create test users for any role (BUYER, FARMER, TRANSPORTER, INSPECTOR)
- View all users organized by role
- Automatically generate unique credentials
- Create associated company profiles for buyers and farmers

### 2. Predefined Scenarios

#### Happy Path Scenario (22 Steps)
Complete successful trade flow from start to finish:

**Phase 1: User Creation (6 steps)**
- Create 3 farmers (Green Valley Farm, Sunny Fields Co, Fresh Harvest Ltd)
- Create buyer (Fresh Foods Inc)
- Create transporter (Fast Logistics)
- Create inspector (Quality Control Pro)

**Phase 2: Sale Listings (3 steps)**
- Farmer 1: 40 tons corn @ €180/ton
- Farmer 2: 35 tons corn @ €175/ton
- Farmer 3: 30 tons corn @ €185/ton

**Phase 3: Trade Setup (2 steps)**
- Buyer creates buy listing: 100 tons corn, max €200/ton
- Admin creates trade operation: 10% margin, 1.5% buyer/2.5% seller commission

**Phase 4: Negotiations (4 steps)**
- Admin sends offers to all 3 farmers (40t, 35t, 25t)
- All 3 farmers accept offers

**Phase 5: Inspection (4 steps)**
- Inspector assigned to verify all farmers
- Farmer 1 verification: PASSED (quality: 95)
- Farmer 2 verification: PASSED (quality: 92)
- Farmer 3 verification: PASSED (quality: 90)

**Phase 6: Transport & Completion (3 steps)**
- Admin creates transport job (50km, €750 total)
- Transporter completes delivery
- Admin marks trade as complete

**Use Case**: Testing the ideal flow when everything works as expected

#### Inspection Failure Scenario (27 Steps)
Simulates a farmer failing inspection and requiring replacement:

**Phase 1: User Creation (7 steps)**
- Create 4 farmers (including 1 replacement)
  - Farmer 1: Quality Farms
  - Farmer 2: Poor Quality Farm (will fail)
  - Farmer 3: Good Harvest
  - Farmer 4: Replacement Farms (backup)
- Create buyer (Quality Foods)
- Create transporter (Reliable Transport)
- Create inspector (Strict Inspector)

**Phase 2: Sale Listings (4 steps)**
- All 4 farmers create sale listings

**Phase 3-4: Initial Trade Setup & Negotiations (6 steps)**
- Buyer creates buy listing
- Admin creates trade operation
- Admin sends offers to first 3 farmers
- All 3 farmers accept

**Phase 5: Inspection with Failure (4 steps)**
- Inspector assigned
- Farmer 1 verification: PASSED (quality: 93)
- **Farmer 2 verification: FAILED (quality: 45)**
- Farmer 3 verification: PASSED (quality: 88)

**Phase 6: Replacement Flow (3 steps)**
- Admin sends offer to Farmer 4 (replacement)
- Farmer 4 accepts
- Inspector verifies Farmer 4: PASSED (quality: 91)

**Phase 7: Transport & Completion (3 steps)**
- Transport created and completed
- Trade marked as complete

**Use Case**: Testing the replacement seller workflow when quality doesn't meet standards

#### Multi Counter-Offer Scenario (21 Steps)
Complex negotiation with multiple rounds of counter-offers:

**Phase 1: User Creation (5 steps)**
- Create 2 farmers (Negotiating Farms, Smart Harvest)
- Create buyer (Strategic Foods)
- Create transporter (Standard Transport)
- Create inspector (Standard Inspector)

**Phase 2: Sale Listings (2 steps)**
- Farmer 1: 60 tons corn @ €190/ton
- Farmer 2: 50 tons corn @ €185/ton

**Phase 3: Trade Setup (2 steps)**
- Buyer creates buy listing: 100 tons, max €200/ton
- Admin creates trade operation

**Phase 4: Complex Negotiations (6 steps)**
- Admin sends initial offers (50t @ €185, 50t @ €180)
- **Farmer 1 counters with higher price: €190/ton**
- Admin accepts Farmer 1's counter-offer
- **Farmer 2 counters with different quantity: 40t @ €185/ton**
- Admin sends new compromise offer: 50t @ €183/ton
- Farmer 2 accepts compromise

**Phase 5: Inspection (3 steps)**
- Inspector assigned
- Both farmers pass inspection

**Phase 6: Transport & Completion (3 steps)**
- Transport created and completed
- Trade marked as complete

**Use Case**: Testing negotiation workflows with price/quantity adjustments

### 3. Execution Modes

#### Step-by-Step Mode
- Execute one step at a time
- Review results after each step
- Manual control over scenario progression
- Best for debugging and learning

#### Auto-Run Mode
- Execute all steps automatically
- 1-second delay between steps
- Complete scenario without intervention
- Best for quick testing and demos

### 4. Real-Time Monitoring
- View step status (pending, in_progress, completed, failed)
- See API responses for each step
- Track user creation results
- Monitor error states

## Architecture

### Frontend Structure
```
admin-dashboard/
├── src/
│   ├── components/
│   │   └── ScenarioOrchestrator.tsx  # Main orchestrator UI
│   ├── services/
│   │   └── simulationApi.ts          # API client for simulation endpoints
│   └── types/
│       └── index.ts                  # TypeScript types
```

### Backend Endpoints

All simulation endpoints require admin authentication (Bearer token).

**Base URL**: `http://localhost:4000/api/simulation`

#### State Queries
- `GET /users/:role` - Get all users by role
- `GET /trade-operation/:id/full-state` - Get complete trade operation state
- `POST /users/create-test-user` - Create a test user

#### Buyer Actions
- `POST /buyer/:userId/create-listing` - Simulate buyer creating a buy listing

#### Farmer Actions
- `POST /seller/:userId/accept-offer` - Simulate farmer accepting an offer
- `POST /seller/:userId/counter-offer` - Simulate farmer making a counter-offer
- `POST /seller/:userId/reject-offer` - Simulate farmer rejecting an offer

#### Transporter Actions
- `POST /transporter/:userId/submit-bid` - Simulate transporter submitting a bid
- `POST /transporter/:userId/start-job` - Simulate transporter starting a job
- `POST /transporter/:userId/complete-delivery` - Simulate completing delivery

#### Inspector Actions
- `POST /inspector/:userId/accept-job` - Simulate inspector accepting a job
- `POST /inspector/:userId/submit-results` - Simulate inspector submitting results

#### Admin Workflow Actions
- `POST /admin/farmer/:farmerId/create-sale-listing` - Create sale listing for a farmer
- `POST /admin/create-trade-operation` - Create trade operation from buy listing
- `POST /admin/send-offers` - Send offers to multiple farmers
- `POST /admin/accept-counter-offer` - Accept farmer's counter-offer
- `POST /admin/assign-inspector` - Assign inspector to trade operation
- `POST /admin/create-transport` - Create and accept transport bid
- `POST /admin/complete-trade` - Complete trade operation

## Data Flow

```
1. Admin Login
   ↓
2. Scenario Selection
   ↓
3. Execution Mode Selection
   ↓
4. Step Execution
   ├─ API Request to Simulation Endpoint
   ├─ Backend Creates/Updates Database Records
   ├─ Response with Created Entity
   └─ UI Updates with Status
   ↓
5. User Overview Refresh
   ↓
6. Repeat for Next Step
```

## Technical Implementation

### TypeScript Types

```typescript
export type UserRole = 'BUYER' | 'FARMER' | 'TRANSPORTER' | 'INSPECTOR' | 'ADMIN' | 'COMPANY_ADMIN';

export interface SimulationUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  company?: {
    id: string;
    legalName: string;
  };
}

interface ScenarioStep {
  step: number;
  description: string;
  actor: UserRole;
  action: string;
  payload?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}
```

### Authentication Flow

1. User enters credentials on login screen
2. POST request to `/api/auth/login`
3. JWT token stored in localStorage as 'adminToken'
4. Axios interceptor automatically adds token to all requests
5. Backend validates token and admin role on each simulation endpoint

### User Creation

When creating a test user:
```typescript
{
  role: 'FARMER',          // Required: User role enum
  name: 'Test Farmer',     // Optional: Display name
  data: {                  // Optional: Additional data
    companyName: 'Farm Co' // Creates associated company
  }
}
```

Backend automatically generates:
- Unique email: `test-farmer-{timestamp}@test.com`
- Unique phone: `+1555{timestamp_last_7_digits}`
- Hashed password: `test123` (bcrypt with 10 rounds)
- Sets flags: `isEmailVerified: true`, `onboardingCompleted: true`, `isActive: true`

## Testing Guide

### Quick Start
1. Ensure backend is running: `cd backend && npm run start:dev`
2. Ensure frontend is running: `cd admin-dashboard && npm run dev`
3. Navigate to http://localhost:5173
4. Click "Scenarios" tab
5. Login with admin credentials
6. Select "Happy Path" scenario
7. Choose "Auto-Run" mode
8. Click "Auto-Run All Steps"
9. Watch users being created in real-time

### Manual Testing
1. Select "Happy Path" scenario
2. Choose "Step-by-Step" mode
3. Click "Execute Next Step" for each step
4. Review the JSON response in the expanded step result
5. Check the "Farmers", "Buyers", "Transporters", "Inspectors" panels
6. Verify users appear in the appropriate role panel

### Debugging
- Check browser console for API errors
- Review step results for specific error messages
- Backend logs available in terminal running `npm run start:dev`
- Failed steps will show red status with error details

## Best Practices

1. **Use Step-by-Step Mode** for initial testing and debugging
2. **Use Auto-Run Mode** for demos and regression testing
3. **Check User Overview** after each step to verify user creation
4. **Review Step Results** when encountering failures
5. **Clean Database** periodically to remove test users

## Database Cleanup

Test users are prefixed with `test-` in their email addresses. To clean up:

```sql
-- Remove test users and associated data
DELETE FROM "User" WHERE email LIKE 'test-%@test.com';
```

Or use the cleanup script:
```bash
cd backend
npx ts-node src/scripts/cleanup-test-users.ts
```

## Future Enhancements

Potential improvements for the scenario orchestrator:

1. **Custom Scenarios**: Allow admins to build scenarios from UI
2. **Scenario Templates**: Save and reuse scenario configurations
3. **Batch Execution**: Run multiple scenarios in sequence
4. **Result Export**: Export scenario results as JSON/CSV
5. **Real-Time WebSocket**: Live updates during scenario execution
6. **Trade Flow Visualization**: Visual diagram of trade workflow
7. **Performance Metrics**: Track scenario execution time
8. **Scenario History**: View past scenario executions
9. **Error Recovery**: Automatic retry on transient failures
10. **State Snapshots**: Save database state before/after scenarios

## Troubleshooting

### Issue: Login fails with 401
**Solution**: Verify admin user exists in database. Run:
```bash
cd backend
npx ts-node src/scripts/test-simulation-endpoints.ts
```

### Issue: User creation returns 400 Bad Request
**Solution**: Check that role is one of: ADMIN, FARMER, BUYER, TRANSPORTER, COMPANY_ADMIN, INSPECTOR

### Issue: Step shows "failed" status
**Solution**:
1. Check step result JSON for error message
2. Verify backend is running
3. Check backend logs for detailed error
4. Ensure database is accessible

### Issue: Users not appearing in overview
**Solution**:
1. Wait for step to show "completed" status
2. Refresh page if necessary
3. Check browser console for errors
4. Verify API token is valid (re-login if needed)

## API Testing Script

For automated testing of all simulation endpoints:

```bash
cd backend
npx ts-node src/scripts/test-simulation-endpoints.ts
```

Expected output:
```
🧪 Testing Simulation Endpoints

1️⃣  Setting up admin...
   ✅ Admin user exists

2️⃣  Logging in as admin...
   ✅ Got admin token

3️⃣  Creating test farmer...
   ✅ Created farmer: test-farmer-1234567890@test.com

4️⃣  Creating test buyer...
   ✅ Created buyer: test-buyer-1234567891@test.com

5️⃣  Getting all farmers...
   ✅ Found X farmers

6️⃣  Getting all buyers...
   ✅ Found Y buyers

✅ All simulation endpoints working correctly!
```

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console
4. Verify database connectivity
5. Ensure all dependencies are installed

## Version History

**v1.0.0** (Current)
- Initial release
- Three predefined scenarios
- Step-by-step and auto-run modes
- User overview by role
- Admin authentication
- 13 simulation endpoints

---

Last Updated: October 5, 2025
