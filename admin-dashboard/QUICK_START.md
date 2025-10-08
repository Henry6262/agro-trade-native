# Scenario Orchestrator - Quick Start Guide

## 🚀 5-Minute Quick Start

### 1. Start the Services (2 terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/henry/agro-trade/backend
npm run start:dev
```
Wait for: `Nest application successfully started` (port 4000)

**Terminal 2 - Admin Dashboard:**
```bash
cd /Users/henry/agro-trade/admin-dashboard
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### 2. Access the Orchestrator

1. Open browser: http://localhost:5173
2. Click **"Scenarios"** tab (purple icon with flask)
3. Login automatically with pre-filled credentials
4. You're in!

### 3. Run Your First Scenario

**Option A: Auto-Run (Fastest)**
1. Click **"Happy Path (22 steps)"** button
2. Click **"Auto-Run"** mode
3. Click **"Auto-Run All Steps"**
4. Watch the magic happen! ✨

**Option B: Step-by-Step (Learning)**
1. Click **"Happy Path (22 steps)"** button
2. Keep **"Step-by-Step"** mode
3. Click **"Execute Next Step"** repeatedly
4. Review each result before continuing

## 📊 What You'll See

### Status Colors
- 🟢 **Green** = Completed successfully
- 🔵 **Blue** = Currently executing
- 🔴 **Red** = Failed (check error message)
- ⚪ **Gray** = Pending

### Step Results
Click **"View details"** under each step to see:
- Created user IDs
- API responses
- Error messages (if any)

### User Panels (Bottom)
Watch users appear in real-time:
- **Buyers** (left panel)
- **Farmers** (2nd panel)
- **Transporters** (3rd panel)
- **Inspectors** (right panel)

## 🎯 Three Scenarios Explained

### 1. Happy Path (22 steps) - 🟢 Recommended First
**What it does:** Complete successful trade
**Time:** ~25 seconds in auto-run
**Result:** 100 tons corn traded from 3 farmers to 1 buyer

**Key Steps:**
- Creates 6 users (3 farmers, buyer, transporter, inspector)
- All farmers accept offers
- All inspections pass
- Delivery completes
- Trade finalized

### 2. Inspection Failure (27 steps) - 🟡 Intermediate
**What it does:** Handles failed inspection with replacement
**Time:** ~30 seconds in auto-run
**Result:** Farmer 2 fails, Farmer 4 replaces successfully

**Key Steps:**
- Creates 7 users (4 farmers, buyer, transporter, inspector)
- Farmer 2 fails quality check (score: 45)
- Admin finds replacement (Farmer 4)
- Farmer 4 passes inspection
- Trade completes with replacement

### 3. Multi Counter-Offer (21 steps) - 🔴 Advanced
**What it does:** Complex price negotiations
**Time:** ~23 seconds in auto-run
**Result:** 2 farmers negotiate prices before accepting

**Key Steps:**
- Creates 5 users (2 farmers, buyer, transporter, inspector)
- Farmer 1 counters with higher price → Admin accepts
- Farmer 2 counters with lower quantity → Admin offers compromise
- Both farmers eventually accept
- Trade completes successfully

## 🔧 Common Actions

### Switch Scenarios
Just click a different scenario button - it auto-resets

### Switch Execution Mode
Click "Step-by-Step" or "Auto-Run" anytime before starting

### Re-run Scenario
Refresh the page or click the same scenario button again

### View User Details
Scroll to bottom user panels to see all created users

## ⚠️ Troubleshooting

### Login Screen Appears
✅ **Normal** - Enter credentials (already filled in) and click Login

### Step Shows "failed" Status
1. Click "View details" to see error
2. Check if backend is running (Terminal 1)
3. Verify database is accessible

### No Users Appearing in Panels
1. Wait for step to show "completed" (green)
2. Users appear ~1 second after creation
3. Refresh page if needed

### Backend Not Responding
```bash
# Check backend is running
curl http://localhost:4000/api

# If not, restart:
cd /Users/henry/agro-trade/backend
npm run start:dev
```

## 📝 What Happens in Each Scenario

### Happy Path Timeline
```
0:00 - Create 3 farmers
0:03 - Create buyer, transporter, inspector
0:06 - Farmers create sale listings
0:09 - Buyer creates buy listing
0:10 - Admin creates trade operation
0:11 - Admin sends 3 offers
0:12 - Farmers accept offers
0:15 - Inspector assigned
0:16 - 3 farmers verified (all pass)
0:19 - Transport created
0:20 - Delivery completed
0:21 - Trade completed ✅
```

### Inspection Failure Timeline
```
0:00 - Create 4 farmers
0:04 - Create buyer, transporter, inspector
0:07 - All 4 farmers create sale listings
0:11 - Buyer creates buy listing
0:12 - Admin creates trade operation
0:13 - Admin sends offers to first 3 farmers
0:14 - All 3 accept
0:17 - Inspector assigned
0:18 - Farmer 1: PASS ✅
0:19 - Farmer 2: FAIL ❌ (quality: 45)
0:20 - Farmer 3: PASS ✅
0:21 - Admin sends offer to Farmer 4 (replacement)
0:22 - Farmer 4 accepts
0:23 - Farmer 4 verified: PASS ✅
0:24 - Transport created
0:25 - Delivery completed
0:26 - Trade completed ✅
```

### Multi Counter-Offer Timeline
```
0:00 - Create 2 farmers
0:02 - Create buyer, transporter, inspector
0:05 - Farmers create sale listings
0:07 - Buyer creates buy listing
0:08 - Admin creates trade operation
0:09 - Admin sends initial offers
0:10 - Farmer 1 counters (€190/ton)
0:11 - Admin accepts Farmer 1 counter
0:12 - Farmer 2 counters (40t instead of 50t)
0:13 - Admin sends new offer (€183/ton compromise)
0:14 - Farmer 2 accepts
0:15 - Inspector assigned
0:16 - Both farmers verified: PASS ✅✅
0:18 - Transport created
0:19 - Delivery completed
0:20 - Trade completed ✅
```

## 💡 Pro Tips

1. **Start with Happy Path** in auto-run to see the full flow
2. **Then try Happy Path** in step-by-step to understand each action
3. **Run Inspection Failure** to see error handling
4. **Run Multi Counter-Offer** to see negotiations
5. **Check user panels** after step 4-7 to see created users
6. **Expand "View details"** to see API responses
7. **Browser console** (F12) shows detailed logs

## 📚 More Information

- **Full Documentation**: `/admin-dashboard/SCENARIO_ORCHESTRATOR.md`
- **Implementation Details**: `/admin-dashboard/IMPLEMENTATION_SUMMARY.md`
- **Backend Simulation Service**: `/backend/src/simulation/simulation.service.ts`

## 🎉 Success Indicators

You know it's working when:
- ✅ All steps turn green (completed)
- ✅ User count increases in bottom panels
- ✅ Each step shows "View details" with data
- ✅ Final step says "Trade operation completed"
- ✅ No red (failed) steps appear

## 🚨 Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal for API logs
3. Review step "View details" for error messages
4. Verify backend is running on port 4000
5. Ensure database is accessible and seeded

---

**Ready to test?** Click "Scenarios" tab and run Happy Path in auto-run mode!
