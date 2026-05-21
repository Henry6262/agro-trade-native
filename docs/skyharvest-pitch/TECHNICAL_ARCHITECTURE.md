# Technical Architecture — SkyInspect + HarvestShares

> **Status:** Conceptual. Ready for implementation planning.  
> **Scope:** Drone integration layer, AI inference pipeline, smart contract extensions, mobile + dashboard UI.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SKYHARVEST PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  DRONE LAYER        │  AI LAYER          │  CONTRACT LAYER    │  APP LAYER  │
│  ───────────        │  ────────          │  ─────────────     │  ────────   │
│  DJI Matrice 30     │  NIR Spectrometer  │  AgroEscrow.sol    │  React      │
│  + RTK-GNSS         │  + Coral TPU       │  (existing)        │  Native     │
│  + Robotic Arm      │  + Gemma 4 Fine-   │                    │  (mobile)   │
│  + 4G/5G Modem      │    tuned Model     │  HarvestShares     │             │
│                     │                    │  Extension         │  Next.js    │
│  Flight Planning    │  Edge Inference    │  (new)             │  (landing)  │
│  API (DJI SDK)      │  < 200ms           │                    │             │
│                     │                    │  SkyInspect        │  NestJS     │
│  LoRa Mesh          │  Cloud Fallback    │  Oracle            │  (backend)  │
│  (backup)           │  (Gemma 4 on       │  (new)             │             │
│                     │   Vertex AI)       │                    │             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. SKYINSPECT — Drone Integration

### Hardware Stack

| Component | Spec | Cost (EUR) | Supplier |
|-----------|------|-----------|----------|
| **Drone Platform** | DJI Matrice 30T | €3,200 | DJI Official |
| **RTK-GNSS Module** | D-RTK 2 Mobile Station | €1,800 | DJI Official |
| **Robotic Arm** | Custom 3-DOF manipulator + soil probe | €800 | Custom build / 3D print |
| **NIR Spectrometer** | Ocean Insight Flame-S | €1,200 | Ocean Insight |
| **Edge Compute** | Google Coral Dev Board Mini + TPU | €120 | Mouser / DigiKey |
| **4G/5G Modem** | Quectel RM500Q-GL 5G module | €180 | AliExpress / DigiKey |
| **Power / Battery** | TB65 Intelligent Flight Battery × 4 | €800 | DJI Official |
| **Total Hardware** | | **€8,100** | |

### Flight Planning System

```typescript
// backend/src/skyinspect/dto/create-mission.dto.ts
export class CreateMissionDto {
  tradeOperationId: string;   // Links to existing trade
  gpsCoordinates: {
    lat: number;
    lng: number;
    altitude: number;         // AGL in meters
  };
  cropType: 'WHEAT' | 'CORN' | 'BARLEY' | 'SUNFLOWER';
  inspectionType: 'QUALITY' | 'SOIL' | 'BOTH';
  scheduledAt: Date;          // When drone should execute
  priority: 'NORMAL' | 'URGENT';
}
```

### Flight Execution Flow

```
1. ADMIN creates mission via dashboard
      │
      ▼
2. Backend queues mission in Redis
      │
      ▼
3. Drone Operator app (tablet) receives mission
      │
      ▼
4. Pre-flight check: battery, weather, no-fly zones
      │
      ▼
5. AUTO or MANUAL launch
      │
      ▼
6. DJI SDK executes waypoint flight
      │
      ▼
7. At waypoint: hover → arm deploy → sample → spectrometer scan
      │
      ▼
8. Edge AI inference on Coral TPU
      │
      ▼
9. Results + GPS + timestamp → 4G/5G → backend
      │
      ▼
10. Backend stores in PostgreSQL, triggers WebSocket
      │
      ▼
11. Admin dashboard shows: "MISSION COMPLETE — Score: 87/100"
      │
      ▼
12. Admin taps APPROVE / REJECT / RE-INSPECT
```

### Edge AI Model

**Input:** NIR spectral data (900–1700nm), soil moisture probe, ambient temp/humidity  
**Output:** Quality score (0–100) + breakdown

```json
{
  "overallScore": 87,
  "breakdown": {
    "proteinContent": 14.2,
    "moistureLevel": 12.8,
    "contaminationRisk": "LOW",
    "mycotoxinProbability": 0.03,
    "soilNitrogen": 45.2
  },
  "confidence": 0.94,
  "modelVersion": "skyinspect-v1.2.0",
  "inferenceTimeMs": 187,
  "spectralFingerprint": "sha256:abc123..."
}
```

**Model:** Fine-tuned Gemma 4 (or TinyLlama / MobileLLM if Gemma 4 unavailable)  
**Training data:** Public NIR spectral datasets + Bulgarian/EU crop lab correlations  
**Inference target:** < 200ms on Coral TPU  
**Fallback:** Cloud inference via Google Vertex AI (adds 800ms latency)

---

## 2. HARVESTSHARES — Smart Contract Extension

### Concept
Extend existing `AgroEscrow.sol` to support **time-locked fractional ownership** of crop batches.

### New Contract: `HarvestShares.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgroEscrow.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HarvestShares
 * @notice Fractional crop ownership via ERC-1155 tokens
 * @dev Each token ID represents 1% ownership of a specific crop batch
 */
contract HarvestShares is ERC1155, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");

    struct Batch {
        string batchId;              // e.g., "BG-2026-W-2847"
        address farmer;
        uint256 totalShares;         // Always 100 (100%)
        uint256 pricePerShare;       // In cUSD wei
        uint256 plantingDate;
        uint256 expectedHarvestDate;
        bytes32 escrowKey;           // Links to AgroEscrow
        BatchStatus status;
        string gpsCoordinates;       // "42.1354,24.7453"
        string cropType;
    }

    enum BatchStatus {
        LISTED,      // Open for pre-sale
        FUNDED,      // All shares sold
        PLANTED,     // Farmer confirms planting
        INSPECTED,   // SkyInspect complete
        HARVESTED,   // Crop ready
        DELIVERED,   // To buyers
        FAILED       // Crop failed, refunds triggered
    }

    mapping(string => Batch) public batches;
    mapping(string => mapping(address => uint256)) public shareHolders;
    mapping(string => uint256) public totalSold;

    AgroEscrow public escrow;
    IERC20 public cUSD;

    event BatchListed(string batchId, address farmer, uint256 pricePerShare);
    event SharesPurchased(string batchId, address buyer, uint256 shares);
    event BatchStatusChanged(string batchId, BatchStatus newStatus);
    event DividendDistributed(string batchId, uint256 totalAmount);
    event RefundTriggered(string batchId, string reason);

    constructor(address _escrow, address _cUSD, string memory _uri) 
        ERC1155(_uri) {
        escrow = AgroEscrow(_escrow);
        cUSD = IERC20(_cUSD);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Farmer lists a new crop batch for pre-sale
     */
    function listBatch(
        string memory _batchId,
        uint256 _pricePerShare,      // cUSD per 1% share
        uint256 _expectedHarvestDate,
        string memory _gpsCoordinates,
        string memory _cropType
    ) external onlyRole(FARMER_ROLE) {
        require(bytes(batches[_batchId].batchId).length == 0, "Batch exists");
        
        batches[_batchId] = Batch({
            batchId: _batchId,
            farmer: msg.sender,
            totalShares: 100,
            pricePerShare: _pricePerShare,
            plantingDate: 0,
            expectedHarvestDate: _expectedHarvestDate,
            escrowKey: 0,
            status: BatchStatus.LISTED,
            gpsCoordinates: _gpsCoordinates,
            cropType: _cropType
        });

        emit BatchListed(_batchId, msg.sender, _pricePerShare);
    }

    /**
     * @notice Buyer purchases shares of a batch
     */
    function purchaseShares(
        string memory _batchId,
        uint256 _shares            // 1 = 1%
    ) external {
        Batch storage batch = batches[_batchId];
        require(batch.status == BatchStatus.LISTED, "Not open");
        require(_shares > 0 && _shares <= 100, "Invalid shares");
        require(totalSold[_batchId] + _shares <= 100, "Not enough shares");

        uint256 totalCost = _shares * batch.pricePerShare;
        
        // Transfer cUSD from buyer to contract
        require(cUSD.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        _mint(msg.sender, uint256(keccak256(bytes(_batchId))), _shares, "");
        shareHolders[_batchId][msg.sender] += _shares;
        totalSold[_batchId] += _shares;

        emit SharesPurchased(_batchId, msg.sender, _shares);

        // If fully funded, lock batch
        if (totalSold[_batchId] == 100) {
            batch.status = BatchStatus.FUNDED;
            emit BatchStatusChanged(_batchId, BatchStatus.FUNDED);
        }
    }

    /**
     * @notice Admin confirms planting, triggers SkyInspect scheduling
     */
    function confirmPlanting(string memory _batchId) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = batches[_batchId];
        require(batch.status == BatchStatus.FUNDED, "Not funded");
        batch.plantingDate = block.timestamp;
        batch.status = BatchStatus.PLANTED;
        emit BatchStatusChanged(_batchId, BatchStatus.PLANTED);
    }

    /**
     * @notice Admin records SkyInspect result
     */
    function recordInspection(
        string memory _batchId,
        uint256 _qualityScore,      // 0-100
        bool _passed
    ) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = batches[_batchId];
        require(batch.status == BatchStatus.PLANTED, "Not planted");
        
        if (_passed && _qualityScore >= 60) {
            batch.status = BatchStatus.INSPECTED;
        } else {
            batch.status = BatchStatus.FAILED;
            emit RefundTriggered(_batchId, "Inspection failed");
        }
        
        emit BatchStatusChanged(_batchId, batch.status);
    }

    /**
     * @notice Distribute harvest revenue pro-rata to shareholders
     */
    function distributeDividends(
        string memory _batchId,
        uint256 _totalRevenue       // cUSD from crop sale
    ) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = batches[_batchId];
        require(batch.status == BatchStatus.DELIVERED, "Not delivered");

        // Admin fee: 3%
        uint256 adminFee = (_totalRevenue * 3) / 100;
        uint256 distributable = _totalRevenue - adminFee;

        // Transfer to each shareholder pro-rata
        // NOTE: In production, use Merkle tree or pull pattern for gas
        // This is simplified for architecture doc

        batch.status = BatchStatus.DELIVERED;
        emit DividendDistributed(_batchId, distributable);
    }

    /**
     * @notice Trigger pro-rata refund if crop fails
     */
    function triggerRefund(string memory _batchId) external onlyRole(ADMIN_ROLE) {
        Batch storage batch = batches[_batchId];
        require(batch.status == BatchStatus.FAILED, "Not failed");
        
        // Pull pattern: each shareholder calls claimRefund()
        // Implementation omitted for brevity
        
        emit RefundTriggered(_batchId, "Crop failure");
    }
}
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **ERC-1155 not ERC-721** | Semi-fungible tokens. Each share of a batch is identical. Gas-efficient. |
| **100 shares per batch** | Simple mental model. 1 share = 1%. Avoids fractional math complexity. |
| **cUSD only (no volatile crypto)** | Farmers and buyers never touch volatile assets. |
| **Pull pattern for refunds** | Prevents gas limit exhaustion with many shareholders. |
| **Admin-gated transitions** | Every state change requires admin authorization. Compliance-friendly. |
| **Linked to AgroEscrow** | Existing escrow contract handles final delivery payment. HarvestShares handles pre-sale. |

---

## 3. BACKEND EXTENSIONS

### New Database Schema (Prisma)

```prisma
// backend/prisma/schema additions

model DroneMission {
  id              String   @id @default(uuid())
  tradeOperationId String
  batchId         String?
  status          DroneMissionStatus @default(PENDING)
  gpsLat          Decimal
  gpsLng          Decimal
  altitude        Int      // meters AGL
  scheduledAt     DateTime
  completedAt     DateTime?
  
  qualityScore    Int?
  spectralData    Json?    // NIR spectrum array
  aiConfidence    Decimal?
  aiModelVersion  String?
  
  droneId         String
  operatorId      String
  
  photos          DronePhoto[]
  tradeOperation  TradeOperation @relation(fields: [tradeOperationId], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model DronePhoto {
  id          String @id @default(uuid())
  missionId   String
  mission     DroneMission @relation(fields: [missionId], references: [id])
  url         String
  type        PhotoType
  timestamp   DateTime
}

model HarvestBatch {
  id              String @id @default(uuid())
  batchId         String @unique  // e.g., "BG-2026-W-2847"
  farmerId        String
  farmer          User @relation(fields: [farmerId], references: [id])
  
  totalShares     Int    @default(100)
  pricePerShare   Decimal @db.Decimal(18, 8)  // cUSD
  
  status          BatchStatus @default(LISTED)
  plantingDate    DateTime?
  expectedHarvest DateTime
  actualHarvest   DateTime?
  
  gpsCoordinates  String
  cropType        String
  
  escrowKey       String?
  contractAddress String?
  
  shares          ShareOwnership[]
  inspections     DroneMission[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ShareOwnership {
  id          String @id @default(uuid())
  batchId     String
  batch       HarvestBatch @relation(fields: [batchId], references: [id])
  buyerId     String
  buyer       User @relation(fields: [buyerId], references: [id])
  shares      Int    // Number of 1% shares owned
  purchasedAt DateTime @default(now())
  
  @@unique([batchId, buyerId])
}

enum DroneMissionStatus {
  PENDING
  SCHEDULED
  IN_FLIGHT
  SAMPLING
  ANALYZING
  COMPLETE
  FAILED
  ABORTED
}

enum PhotoType {
  AERIAL
  SAMPLE_CLOSEUP
  SPECTRAL_READOUT
  GPS_MARKER
}

enum BatchStatus {
  LISTED
  FUNDED
  PLANTED
  INSPECTED
  HARVESTED
  DELIVERED
  FAILED
}
```

### New API Endpoints

```typescript
// SkyInspect
POST   /skyinspect/missions              // Create mission
GET    /skyinspect/missions/:id          // Get mission status
POST   /skyinspect/missions/:id/abort    // Emergency abort
POST   /skyinspect/missions/:id/results  // Drone uploads results
GET    /skyinspect/missions/:id/photos   // Get mission photos

// HarvestShares
POST   /harvest/batches                  // Farmer lists batch
GET    /harvest/batches                  // Browse available batches
POST   /harvest/batches/:id/shares       // Buy shares
GET    /harvest/batches/:id/shares       // Get my shares
POST   /harvest/batches/:id/plant        // Admin confirms planting
POST   /harvest/batches/:id/inspect      // Admin records inspection
POST   /harvest/batches/:id/harvest      // Admin records harvest
POST   /harvest/batches/:id/distribute   // Admin distributes revenue
POST   /harvest/batches/:id/refund       // Admin triggers refund
```

---

## 4. MOBILE APP SCREENS

### New Screens for HarvestShares

| Screen | Key Elements |
|--------|-------------|
| **Browse Batches** | Map view with batch pins. List view: photo, crop type, farmer, price/share, % sold, harvest date. Filter by crop type, region, price. |
| **Batch Detail** | Hero photo, farmer profile, GPS map, batch timeline (winter→spring→summer→harvest), share purchase slider (1–100%), total cost calculator. |
| **My Shares** | Portfolio view: total invested, active batches, upcoming harvests, historical returns. |
| **Harvest Alert** | Push notification: "Batch #2847 inspected: Score 87/100. Harvest expected July 15." |

### New Screens for SkyInspect

| Screen | Key Elements |
|--------|-------------|
| **Mission Status** | Live drone telemetry: GPS, altitude, battery, signal strength. Mission phase indicator. |
| **Inspection Result** | Quality score ring (0–100), breakdown bars, spectral graph, AI confidence, approve/reject buttons. |

---

## 5. ADMIN DASHBOARD ENHANCEMENTS

### SkyInspect Panel
```
┌─────────────────────────────────────────┐
│ SKYINSPECT MISSIONS                     │
├─────────────────────────────────────────┤
│ [Map] Drone icons on crop locations     │
│                                         │
│ Pending: 3   In Flight: 1   Complete: 12│
│                                         │
│ Latest Result:                          │
│ Batch #2847 | Score: 87/100 ✅          │
│ Protein: 14.2% | Moisture: 12.8%        │
│ [View Spectral] [Approve] [Re-inspect]  │
└─────────────────────────────────────────┘
```

### HarvestShares Panel
```
┌─────────────────────────────────────────┐
│ HARVESTSHARES                           │
├─────────────────────────────────────────┤
│ Active Batches: 8 | Total Value: €142K  │
│                                         │
│ Batch #2847 (Wheat, Plovdiv)            │
│ Listed: €40K | Sold: 100% | Status: 🌱  │
│ [Confirm Planting] [Schedule Drone]     │
│                                         │
│ Shareholders:                           │
│ Buyer A: 30% | Buyer B: 20% | ...       │
└─────────────────────────────────────────┘
```

---

## 6. SECURITY & COMPLIANCE

| Concern | Mitigation |
|---------|-----------|
| **Drone no-fly zones** | Integrate EU drone airspace API (U-space). Auto-abort if restricted. |
| **Sample contamination** | Sterile single-use probe tips. Chain of custody logged on blockchain. |
| **AI model accuracy** | Calibrate against certified lab analysis monthly. Human override always available. |
| **Smart contract risk** | Formal audit before mainnet. Bug bounty program. |
| **Farmer exploitation** | Price floor enforcement. Admin cannot list below market rate. |
| **Buyer fraud** | KYC required for purchases > €1,000. Anti-money laundering checks. |

---

## 7. COST BREAKDOWN (6-Month Pilot)

| Category | Cost (EUR) |
|----------|-----------|
| **Hardware** (3 drones + payloads) | €24,300 |
| **Software Development** (4 weeks @ full-time) | €8,000 |
| **Smart Contract Audit** | €12,000 |
| **Legal Framework** (HarvestShares T&Cs) | €6,000 |
| **Pilot Operations** (fuel, transport, insurance) | €4,700 |
| **AI Model Training** (cloud compute + data labeling) | €3,000 |
| **Contingency** (10%) | €5,800 |
| **TOTAL** | **€63,800** |

**Ask: €100K** covers pilot + 6-month runway + second-market preparation.

---

## 8. IMPLEMENTATION ROADMAP

```
Week 1-2:   Hardware procurement + drone assembly
Week 3-4:   Backend API development (SkyInspect + HarvestShares)
Week 5-6:   Smart contract development + unit tests
Week 7-8:   Mobile app screens + admin dashboard panels
Week 9-10:  AI model fine-tuning + spectral calibration
Week 11-12: Integration testing + end-to-end flow
Week 13-14: Smart contract audit
Week 15-16: Pilot launch (1 farm, 1 batch)
Week 17-24: Pilot operation + data collection + iteration
```

---

*Architecture v1.0 — 2026-05-12*  
*Next step: Smart contract audit vendor selection + DJI SDK access application*
