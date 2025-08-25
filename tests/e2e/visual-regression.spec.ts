import { test, expect, Page } from '@playwright/test';

const PAGES_TO_TEST = [
  { name: 'Dashboard', path: '/' },
  { name: 'Buyer', path: '/buyer' },
  { name: 'Seller', path: '/seller' },
  { name: 'Transporter', path: '/transporter' },
  { name: 'Command Center', path: '/command-center' },
  { name: 'Agent Network', path: '/agent-network' },
  { name: 'Intelligence', path: '/intelligence' },
  { name: 'Operations', path: '/operations' },
];

test.describe('Visual Regression Tests', () => {
  test.describe.parallel('React Web App', () => {
    PAGES_TO_TEST.forEach(({ name, path }) => {
      test(`${name} page screenshot`, async ({ page }) => {
        await page.goto(`http://localhost:3000${path}`);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`web-${name.toLowerCase().replace(/ /g, '-')}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    });
  });

  test.describe.parallel('React Native Web', () => {
    PAGES_TO_TEST.forEach(({ name, path }) => {
      test(`${name} page screenshot`, async ({ page }) => {
        await page.goto(`http://localhost:3001${path}`);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`native-${name.toLowerCase().replace(/ /g, '-')}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    });
  });
});

test.describe('Component Comparison Tests', () => {
  test('Compare Card Components', async ({ page }) => {
    // Create a comparison page
    await page.goto('http://localhost:3000/');
    const webCard = await page.locator('.card').first().screenshot();
    
    await page.goto('http://localhost:3001/');
    const nativeCard = await page.locator('[data-testid="card"]').first().screenshot();
    
    // Visual comparison will be done by Playwright
    expect(webCard).toMatchSnapshot('card-component.png');
    expect(nativeCard).toMatchSnapshot('card-component-native.png');
  });

  test('Compare Badge Components', async ({ page }) => {
    await page.goto('http://localhost:3000/command-center');
    const webBadge = await page.locator('.badge').first().screenshot();
    
    await page.goto('http://localhost:3001/command-center');
    const nativeBadge = await page.locator('[data-testid="badge"]').first().screenshot();
    
    expect(webBadge).toMatchSnapshot('badge-component.png');
    expect(nativeBadge).toMatchSnapshot('badge-component-native.png');
  });
});

test.describe('Layout Consistency Tests', () => {
  const viewportSizes = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1366, height: 768, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  viewportSizes.forEach(({ width, height, name }) => {
    test(`Command Center - ${name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      
      // Test web version
      await page.goto('http://localhost:3000/command-center');
      await page.waitForLoadState('networkidle');
      const webScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled',
      });
      
      // Test native version
      await page.goto('http://localhost:3001/command-center');
      await page.waitForLoadState('networkidle');
      const nativeScreenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled',
      });
      
      expect(webScreenshot).toMatchSnapshot(`command-center-${name}-web.png`);
      expect(nativeScreenshot).toMatchSnapshot(`command-center-${name}-native.png`);
    });
  });
});

test.describe('Interactive Elements Tests', () => {
  test('Button hover states', async ({ page }) => {
    // Web version
    await page.goto('http://localhost:3000/buyer');
    const webButton = page.locator('button').first();
    await webButton.hover();
    const webHoverScreenshot = await webButton.screenshot();
    
    // Native version (React Native web doesn't have hover on mobile, but we can test web build)
    await page.goto('http://localhost:3001/buyer');
    const nativeButton = page.locator('button').first();
    await nativeButton.hover();
    const nativeHoverScreenshot = await nativeButton.screenshot();
    
    expect(webHoverScreenshot).toMatchSnapshot('button-hover-web.png');
    expect(nativeHoverScreenshot).toMatchSnapshot('button-hover-native.png');
  });

  test('Modal overlays', async ({ page }) => {
    // Web version
    await page.goto('http://localhost:3000/buyer');
    await page.click('button:has-text("New Request")');
    await page.waitForSelector('.modal, [role="dialog"]');
    const webModalScreenshot = await page.screenshot();
    
    // Native version
    await page.goto('http://localhost:3001/buyer');
    await page.click('button:has-text("New Request")');
    await page.waitForTimeout(500); // Wait for modal animation
    const nativeModalScreenshot = await page.screenshot();
    
    expect(webModalScreenshot).toMatchSnapshot('modal-web.png');
    expect(nativeModalScreenshot).toMatchSnapshot('modal-native.png');
  });
});

test.describe('Data Visualization Tests', () => {
  test('Chart rendering comparison', async ({ page }) => {
    // Web version chart
    await page.goto('http://localhost:3000/command-center');
    await page.waitForSelector('svg, canvas, [data-testid="chart"]');
    const webChart = await page.locator('.chart, [data-testid="chart"]').first().screenshot();
    
    // Native version chart
    await page.goto('http://localhost:3001/command-center');
    await page.waitForTimeout(1000); // Wait for chart to render
    const nativeChart = await page.locator('[data-testid="chart"]').first().screenshot();
    
    expect(webChart).toMatchSnapshot('chart-web.png');
    expect(nativeChart).toMatchSnapshot('chart-native.png');
  });
});