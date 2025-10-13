# Daily Build Checks

## Overview
This document describes the daily build check process for the Agro-Trade backend to catch TypeScript compilation errors early.

## Quick Start

Run the daily build check with:
```bash
npm run build:check
```

## What It Does

The build check:
1. Cleans the dist directory
2. Runs TypeScript compilation
3. Reports success or failure with timestamps
4. Exits with appropriate status codes

## When to Use

### Daily Usage
Run this check at the start of each development day:
```bash
npm run build:check
```

### Before Commits
Always run before committing changes:
```bash
npm run build:check && git add . && git commit -m "your message"
```

### In CI/CD
Add to your CI pipeline to prevent broken builds from being deployed.

## Build Status

### ✅ Success
```
✅ BUILD SUCCESSFUL - No TypeScript errors!
```
Exit code: 0

### ❌ Failure
```
❌ BUILD FAILED - TypeScript errors detected!
🔧 Please fix the errors above
```
Exit code: 1

## Recent Fixes (Oct 11, 2025)

Fixed 73 TypeScript compilation errors:
- Archived outdated test scripts to `src/scripts/.archive/`
- Fixed Prisma relation names in `simulation.service.ts`:
  - Changed `transportRequests` → `transportRequest` (singular)
  - Changed `inspectionRequests` → `inspections`
- Fixed enum usage in `simulation.controller.ts`:
  - Changed `'ACCEPTED'` → `TransportRequestStatus.ASSIGNED`
  - Cast `vehicleType` as `TruckType` enum
- Added proper imports for `TransportRequestStatus`

## Manual Build Commands

### Standard Build
```bash
npm run build
```

### Development Watch Mode
```bash
npm run start:dev
```

### Production Build
```bash
npm run build && npm run start:prod
```

## Troubleshooting

### Permission Denied
If you get permission errors:
```bash
chmod +x scripts/daily-build-check.sh
```

### Build Errors
1. Read error messages carefully - they show file and line numbers
2. Check Prisma schema for correct field and enum names
3. Verify all imports are correct
4. Run `npx prisma generate` if Prisma types are outdated

## Best Practices

1. **Run daily** - Catch issues early before they accumulate
2. **Run before commits** - Don't commit broken code
3. **Fix immediately** - Don't let errors pile up
4. **Keep clean** - Archive old/unused test files regularly
