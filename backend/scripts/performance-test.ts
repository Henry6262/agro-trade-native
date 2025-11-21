/**
 * Performance Testing Script for Agro-Trade Backend
 *
 * Tests API endpoints and measures response times
 * Run with: npx ts-node backend/scripts/performance-test.ts
 */

import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
const SLOW_THRESHOLD = 500; // ms
const MODERATE_THRESHOLD = 200; // ms

interface TestResult {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
}

/**
 * Test a single endpoint
 */
async function testEndpoint(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any,
): Promise<TestResult> {
  const start = Date.now();

  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: 30000, // 30 second timeout
    });

    const duration = Date.now() - start;

    return {
      endpoint: url,
      method,
      duration,
      status: response.status,
      success: true,
    };
  } catch (error: any) {
    const duration = Date.now() - start;

    return {
      endpoint: url,
      method,
      duration,
      status: error.response?.status || 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Format test result with color
 */
function formatResult(result: TestResult): string {
  let icon: string;
  let color: string;

  if (!result.success) {
    icon = '❌';
    color = '\x1b[31m'; // Red
  } else if (result.duration > SLOW_THRESHOLD) {
    icon = '🐌';
    color = '\x1b[31m'; // Red
  } else if (result.duration > MODERATE_THRESHOLD) {
    icon = '⚠️';
    color = '\x1b[33m'; // Yellow
  } else {
    icon = '✅';
    color = '\x1b[32m'; // Green
  }

  const reset = '\x1b[0m';

  return `${icon} ${color}${result.method} ${result.endpoint}${reset} - ${result.duration}ms (${result.status})`;
}

/**
 * Run all performance tests
 */
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests: Promise<TestResult>[] = [
    // Region endpoints (should be fast and cached)
    testEndpoint(`${BASE_URL}/regions`),
    testEndpoint(`${BASE_URL}/regions/cities`),

    // Trade operations
    testEndpoint(`${BASE_URL}/trade-operations`),
    testEndpoint(`${BASE_URL}/trade-operations?page=1&limit=10`),

    // Inspections (with pagination)
    testEndpoint(`${BASE_URL}/inspections`),
    testEndpoint(`${BASE_URL}/inspections?page=1&limit=20`),

    // Products
    testEndpoint(`${BASE_URL}/products`),

    // Transport requests
    testEndpoint(`${BASE_URL}/transport/requests`),
  ];

  // Run all tests in parallel
  const results = await Promise.all(tests);

  // Print results
  console.log('📊 Test Results:\n');
  results.forEach(result => {
    console.log(formatResult(result));
  });

  // Calculate statistics
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const slowTests = successfulTests.filter(r => r.duration > SLOW_THRESHOLD);
  const moderateTests = successfulTests.filter(
    r => r.duration > MODERATE_THRESHOLD && r.duration <= SLOW_THRESHOLD
  );
  const fastTests = successfulTests.filter(r => r.duration <= MODERATE_THRESHOLD);

  const avgDuration = successfulTests.length > 0
    ? successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length
    : 0;

  const minDuration = successfulTests.length > 0
    ? Math.min(...successfulTests.map(r => r.duration))
    : 0;

  const maxDuration = successfulTests.length > 0
    ? Math.max(...successfulTests.map(r => r.duration))
    : 0;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Performance Summary:\n');
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Successful: ${successfulTests.length}`);
  console.log(`❌ Failed: ${failedTests.length}`);
  console.log('');
  console.log(`⚡ Fast (<${MODERATE_THRESHOLD}ms): ${fastTests.length}`);
  console.log(`⚠️  Moderate (${MODERATE_THRESHOLD}-${SLOW_THRESHOLD}ms): ${moderateTests.length}`);
  console.log(`🐌 Slow (>${SLOW_THRESHOLD}ms): ${slowTests.length}`);
  console.log('');
  console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
  console.log(`Min Response Time: ${minDuration}ms`);
  console.log(`Max Response Time: ${maxDuration}ms`);

  // Print slow endpoints
  if (slowTests.length > 0) {
    console.log('\n⚠️  Slow Endpoints Requiring Attention:');
    slowTests.forEach(test => {
      console.log(`  - ${test.method} ${test.endpoint}: ${test.duration}ms`);
    });
  }

  // Print failed endpoints
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failedTests.forEach(test => {
      console.log(`  - ${test.method} ${test.endpoint}: ${test.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit code based on results
  if (failedTests.length > 0) {
    console.log('\n⚠️  Some tests failed. Check server logs.');
    process.exit(1);
  } else if (slowTests.length > 2) {
    console.log('\n⚠️  Performance needs improvement.');
    process.exit(1);
  } else {
    console.log('\n✅ Performance is good!');
    process.exit(0);
  }
}

// Run tests
runPerformanceTests().catch(error => {
  console.error('❌ Performance test failed:', error.message);
  process.exit(1);
});
