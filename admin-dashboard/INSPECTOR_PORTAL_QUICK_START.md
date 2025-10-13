# Inspector Portal - Quick Start Guide

## Overview
The Inspector Portal allows inspectors to view pending inspections and complete quality verification workflows.

## Access
1. Start admin dashboard: `npm run dev`
2. Navigate to **Inspections** tab (teal clipboard icon)

## Features

### Viewing Inspections
- **Table View**: All pending inspections displayed with key information
- **Columns**: Seller, Product, Location, Priority, Requested Date, Status, Actions

### Filtering
- **Priority**: Filter by HIGH, MEDIUM, LOW
- **Product**: Select specific product types
- **Region**: Filter by geographic region
- **Search**: Free-text search across seller, product, location

### Completing Inspections
1. Click **Start Inspection** button
2. Set **Quality Score** (0-100) using slider
3. Verify/adjust **Quality Grade** (auto-suggested)
4. Add optional **Notes**
5. Click **Submit Results**

### Quality Scoring
- **0-40**: Feed grade (red)
- **41-70**: Standard grade (yellow)
- **71-100**: Premium grade (green)

## API Endpoints Used

### GET /api/inspections
Fetch inspections with filters
- Query: `?status=PENDING&priority=HIGH`

### PATCH /api/inspections/:id
Complete inspection
- Body: `{ status, qualityScore, qualityGrade, notes }`

## Components

### InspectorPortal.tsx
Main portal view with table and filters

### InspectionForm.tsx
Modal for completing inspections

## Future Features
- Photo upload
- Geolocation
- Inspector assignment
- Bulk operations
- Real-time WebSocket updates

## Testing
Run API tests: `node backend/test-inspector-portal.js`

## Support
See `/admin-dashboard/INSPECTOR_PORTAL_IMPLEMENTATION.md` for detailed documentation.
