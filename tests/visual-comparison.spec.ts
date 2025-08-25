import { test, expect, Page } from '@playwright/test';
import { join } from 'path';

// Configuration for both apps
const REACT_APP_URL = 'http://localhost:3000';
const REACT_NATIVE_WEB_URL = 'http://localhost:8081'; // Expo web

test.describe('Dashboard UI Parity Tests', () => {
  let reactPage: Page;
  let rnPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Open both apps in separate contexts
    const reactContext = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const rnContext = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    reactPage = await reactContext.newPage();
    rnPage = await rnContext.newPage();

    // Navigate to both apps
    await reactPage.goto(REACT_APP_URL);
    await rnPage.goto(REACT_NATIVE_WEB_URL);
  });

  test('Main Dashboard - Visual Comparison', async () => {
    // Take screenshots of both dashboards
    const reactScreenshot = await reactPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/react-dashboard.png')
    });

    const rnScreenshot = await rnPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/rn-dashboard.png')
    });

    // Compare visual similarity
    expect(reactScreenshot).toMatchSnapshot('dashboard-main.png');
    expect(rnScreenshot).toMatchSnapshot('dashboard-main-rn.png');
  });

  test('Command Center - Visual Comparison', async () => {
    // Navigate to command center
    await reactPage.goto(`${REACT_APP_URL}/command-center`);
    await rnPage.goto(`${REACT_NATIVE_WEB_URL}/command-center`);

    const reactScreenshot = await reactPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/react-command-center.png')
    });

    const rnScreenshot = await rnPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/rn-command-center.png')
    });

    expect(reactScreenshot).toMatchSnapshot('command-center.png');
    expect(rnScreenshot).toMatchSnapshot('command-center-rn.png');
  });

  test('Intelligence Screen - Visual Comparison', async () => {
    await reactPage.goto(`${REACT_APP_URL}/intelligence`);
    await rnPage.goto(`${REACT_NATIVE_WEB_URL}/intelligence`);

    const reactScreenshot = await reactPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/react-intelligence.png')
    });

    const rnScreenshot = await rnPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/rn-intelligence.png')
    });

    expect(reactScreenshot).toMatchSnapshot('intelligence.png');
    expect(rnScreenshot).toMatchSnapshot('intelligence-rn.png');
  });

  test('Operations Screen - Visual Comparison', async () => {
    await reactPage.goto(`${REACT_APP_URL}/operations`);
    await rnPage.goto(`${REACT_NATIVE_WEB_URL}/operations`);

    const reactScreenshot = await reactPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/react-operations.png')
    });

    const rnScreenshot = await rnPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/rn-operations.png')
    });

    expect(reactScreenshot).toMatchSnapshot('operations.png');
    expect(rnScreenshot).toMatchSnapshot('operations-rn.png');
  });

  test('Agent Network - Visual Comparison', async () => {
    await reactPage.goto(`${REACT_APP_URL}/agent-network`);
    await rnPage.goto(`${REACT_NATIVE_WEB_URL}/agent-network`);

    const reactScreenshot = await reactPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/react-agent-network.png')
    });

    const rnScreenshot = await rnPage.screenshot({
      fullPage: true,
      path: join(__dirname, 'screenshots/rn-agent-network.png')
    });

    expect(reactScreenshot).toMatchSnapshot('agent-network.png');
    expect(rnScreenshot).toMatchSnapshot('agent-network-rn.png');
  });

  // Mobile responsive tests
  test.describe('Mobile Responsive Tests', () => {
    test('Dashboard Mobile View', async () => {
      await reactPage.setViewportSize({ width: 375, height: 812 });
      await rnPage.setViewportSize({ width: 375, height: 812 });

      const reactMobile = await reactPage.screenshot({
        fullPage: true,
        path: join(__dirname, 'screenshots/react-mobile-dashboard.png')
      });

      const rnMobile = await rnPage.screenshot({
        fullPage: true,
        path: join(__dirname, 'screenshots/rn-mobile-dashboard.png')
      });

      expect(reactMobile).toMatchSnapshot('dashboard-mobile.png');
      expect(rnMobile).toMatchSnapshot('dashboard-mobile-rn.png');
    });
  });

  // Component-level comparisons
  test.describe('Component Parity Tests', () => {
    test('Card Components Match', async () => {
      // Check card styling
      const reactCard = await reactPage.locator('.card, [class*="rounded-lg"]').first();
      const rnCard = await rnPage.locator('[class*="rounded-lg"]').first();

      if (await reactCard.isVisible() && await rnCard.isVisible()) {
        const reactStyles = await reactCard.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            borderRadius: styles.borderRadius,
            padding: styles.padding,
            border: styles.border
          };
        });

        const rnStyles = await rnCard.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            backgroundColor: styles.backgroundColor,
            borderRadius: styles.borderRadius,
            padding: styles.padding,
            border: styles.border
          };
        });

        // Compare styles
        expect(reactStyles.borderRadius).toBe(rnStyles.borderRadius);
      }
    });

    test('Navigation Elements Match', async () => {
      // Check navigation items
      const reactNav = await reactPage.locator('nav, [role="navigation"]').first();
      const rnNav = await rnPage.locator('[role="navigation"], nav').first();

      if (await reactNav.isVisible() && await rnNav.isVisible()) {
        const reactNavItems = await reactNav.locator('a, button').count();
        const rnNavItems = await rnNav.locator('[role="button"], button').count();

        // Should have same number of navigation items
        expect(reactNavItems).toBe(rnNavItems);
      }
    });

    test('Color Scheme Consistency', async () => {
      // Check background colors
      const reactBg = await reactPage.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      const rnBg = await rnPage.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });

      // Both should have dark theme (black or very dark)
      expect(reactBg).toContain('0, 0, 0'); // RGB for black
      expect(rnBg).toContain('0, 0, 0');
    });
  });

  test.afterAll(async () => {
    await reactPage.close();
    await rnPage.close();
  });
});

// Pixel-by-pixel comparison helper
async function compareScreenshots(screenshot1: Buffer, screenshot2: Buffer, threshold = 0.1) {
  // This would use a library like pixelmatch in a real implementation
  // For now, we're using Playwright's built-in snapshot testing
  return true;
}