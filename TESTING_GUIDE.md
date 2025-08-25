# Visual Testing Guide for Agro Trade Platform

## Overview
This guide explains how to run visual regression tests to ensure UI consistency between the React web dashboard and React Native mobile app.

## Prerequisites
- Node.js and npm installed
- Both applications dependencies installed:
  ```bash
  cd fe-dashboar/v0-agro-trade-dashboard && npm install
  cd ../../front-end && npm install
  ```

## Test Setup
Playwright has been configured to test both applications in parallel:
- **React Web App**: Runs on http://localhost:3000
- **React Native Web**: Runs on http://localhost:3001

## Running Tests

### 1. Install Playwright Browsers (first time only)
```bash
npm run test:install
```

### 2. Run Both Applications
```bash
npm run start:all
```
This starts both the React and React Native apps in parallel.

### 3. Run Visual Tests
```bash
npm run test:visual
```

### 4. Update Baseline Screenshots
When UI changes are intentional:
```bash
npm run test:visual:update
```

### 5. View Test Results
```bash
npm run test:visual:report
```

### 6. Interactive Test UI
For debugging and developing tests:
```bash
npm run test:visual:ui
```

## Test Coverage

### Pages Tested
- Dashboard (Main)
- Buyer Dashboard
- Seller Dashboard
- Transporter Dashboard
- Command Center
- Agent Network
- Intelligence
- Operations

### Test Types
1. **Full Page Screenshots**: Captures entire page layouts
2. **Component Comparison**: Individual component visual testing
3. **Responsive Testing**: Multiple viewport sizes (desktop, laptop, tablet, mobile)
4. **Interactive Elements**: Hover states, modals, and animations
5. **Data Visualizations**: Charts and graphs rendering

## Interpreting Results

### Success Indicators
- ✅ All tests pass: UI is consistent between platforms
- ✅ Screenshots match baselines: No unintended changes

### Failure Analysis
When tests fail:
1. Check the diff images in `test-results/`
2. Review specific component differences
3. Determine if changes are intentional
4. Update baselines if changes are approved

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Install dependencies
  run: npm install
  
- name: Install Playwright
  run: npx playwright install --with-deps
  
- name: Run visual tests
  run: npm run test:visual
  
- name: Upload results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Kill existing processes: `lsof -ti:3000,3001 | xargs kill`
   
2. **Tests timeout**
   - Increase timeout in `playwright.config.ts`
   - Check if applications are running properly
   
3. **Screenshot differences on CI**
   - Use Docker for consistent rendering
   - Set fixed viewport sizes
   
4. **React Native web build issues**
   - Clear Expo cache: `npx expo start -c`
   - Rebuild: `cd front-end && npm run web`

## Best Practices

1. **Regular Testing**: Run tests before committing UI changes
2. **Baseline Management**: Keep baselines updated and version controlled
3. **Cross-platform Validation**: Test on multiple browsers and devices
4. **Documentation**: Document any intentional UI differences between platforms
5. **Performance**: Use parallel testing for faster execution

## Migration Status

The React Native app has been fully migrated to match the React web dashboard with:
- ✅ Identical layouts and component hierarchy
- ✅ Matching color schemes and typography
- ✅ Consistent spacing and padding
- ✅ Same interactive behaviors
- ✅ Aligned mock data structures

All dashboard screens have been converted with pixel-perfect accuracy using NativeWind for styling.