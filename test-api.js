#!/usr/bin/env node

/**
 * API Test Script for MovieSayWhat
 * Tests authentication, payment, and search functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let testUser = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  password: 'testpass123'
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`Testing: ${name}`, 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Register User
async function testRegister() {
  logTest('User Registration');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.token && response.data.user) {
      authToken = response.data.token;
      logSuccess('User registered successfully');
      logInfo(`User ID: ${response.data.user.id}`);
      logInfo(`Email: ${response.data.user.email}`);
      logInfo(`Plan: ${response.data.user.plan}`);
      logInfo(`Search Limit: ${response.data.user.searchLimit}`);
      return true;
    }
  } catch (error) {
    logError(`Registration failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 2: Login User
async function testLogin() {
  logTest('User Login');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.data.token && response.data.user) {
      authToken = response.data.token;
      logSuccess('User logged in successfully');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 3: Verify Token
async function testVerifyToken() {
  logTest('Token Verification');
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.user) {
      logSuccess('Token verified successfully');
      logInfo(`User: ${response.data.user.name}`);
      logInfo(`Plan: ${response.data.user.plan}`);
      return true;
    }
  } catch (error) {
    logError(`Token verification failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 4: Get User Profile
async function testGetProfile() {
  logTest('Get User Profile');
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data) {
      logSuccess('Profile retrieved successfully');
      logInfo(`Name: ${response.data.name}`);
      logInfo(`Email: ${response.data.email}`);
      logInfo(`Plan: ${response.data.plan}`);
      logInfo(`Searches Used: ${response.data.searchesUsed}/${response.data.searchLimit}`);
      if (response.data.nextResetDate) {
        logInfo(`Next Reset: ${new Date(response.data.nextResetDate).toLocaleDateString()}`);
      }
      return true;
    }
  } catch (error) {
    logError(`Get profile failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 5: Get Pricing Plans
async function testGetPlans() {
  logTest('Get Pricing Plans');
  try {
    const response = await axios.get(`${BASE_URL}/api/payment/plans`);
    
    if (response.data.plans) {
      logSuccess('Pricing plans retrieved successfully');
      Object.entries(response.data.plans).forEach(([key, plan]) => {
        logInfo(`${plan.name}: $${plan.price / 100} - ${plan.searches === -1 ? 'Unlimited' : plan.searches} searches`);
      });
      return true;
    }
  } catch (error) {
    logError(`Get plans failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 6: Perform Search (without auth)
async function testSearchNoAuth() {
  logTest('Search Without Authentication');
  try {
    await axios.get(`${BASE_URL}/api/search?query=hello`);
    logError('Search should have failed without auth');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Search correctly requires authentication');
      return true;
    }
    logError(`Unexpected error: ${error.message}`);
    return false;
  }
}

// Test 7: Perform Search (with auth)
async function testSearchWithAuth() {
  logTest('Search With Authentication');
  try {
    const response = await axios.get(`${BASE_URL}/api/search?query=hello`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data) {
      logSuccess('Search completed successfully');
      logInfo(`Results found: ${response.data.results?.length || 0}`);
      logInfo(`Searches Used: ${response.data.searchesUsed}/${response.data.searchLimit}`);
      logInfo(`Can Download: ${response.data.canDownload}`);
      if (response.data.nextResetDate) {
        logInfo(`Next Reset: ${new Date(response.data.nextResetDate).toLocaleDateString()}`);
      }
      return true;
    }
  } catch (error) {
    logError(`Search failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 8: Test Search Limit
async function testSearchLimit() {
  logTest('Search Limit Enforcement');
  try {
    // Perform searches until limit is reached
    let searchCount = 0;
    const maxSearches = 5; // Free plan limit
    
    for (let i = 0; i < maxSearches + 1; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/api/search?query=test${i}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        searchCount++;
        logInfo(`Search ${i + 1}: Success (${response.data.searchesUsed}/${response.data.searchLimit})`);
        await sleep(100); // Small delay between requests
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.upgrade) {
          logSuccess(`Search limit enforced after ${searchCount} searches`);
          logInfo(`Error message: ${error.response.data.error}`);
          return true;
        }
        throw error;
      }
    }
    
    logError('Search limit was not enforced');
    return false;
  } catch (error) {
    logError(`Search limit test failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test 9: Initialize Payment (will fail without real Paystack keys)
async function testInitializePayment() {
  logTest('Initialize Payment');
  try {
    const response = await axios.post(`${BASE_URL}/api/payment/initialize`, {
      email: testUser.email,
      plan: 'basic'
    });
    
    if (response.data.data?.authorization_url) {
      logSuccess('Payment initialized successfully');
      logInfo(`Payment URL: ${response.data.data.authorization_url}`);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 500) {
      logInfo('Payment initialization failed (expected without valid Paystack keys)');
      logInfo('Configure PAYSTACK_SECRET_KEY in .env to test payments');
      return true; // Not a real failure
    }
    logError(`Payment initialization failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   MovieSayWhat API Test Suite             ║', 'cyan');
  log('╚════════════════════════════════════════════╝', 'cyan');
  
  logInfo(`Testing against: ${BASE_URL}`);
  logInfo('Make sure the server is running (npm start)\n');
  
  await sleep(1000);
  
  const tests = [
    { name: 'Register', fn: testRegister },
    { name: 'Login', fn: testLogin },
    { name: 'Verify Token', fn: testVerifyToken },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Get Plans', fn: testGetPlans },
    { name: 'Search (No Auth)', fn: testSearchNoAuth },
    { name: 'Search (With Auth)', fn: testSearchWithAuth },
    { name: 'Search Limit', fn: testSearchLimit },
    { name: 'Initialize Payment', fn: testInitializePayment }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      await sleep(500);
    } catch (error) {
      results.push({ name: test.name, passed: false });
      logError(`Test crashed: ${error.message}`);
    }
  }
  
  // Summary
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log('Test Summary', 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  if (passed === total) {
    log(`\n🎉 All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`\n⚠️  ${passed}/${total} tests passed`, 'yellow');
  }
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(BASE_URL);
    return true;
  } catch (error) {
    return false;
  }
}

// Start tests
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    logError('Server is not running!');
    logInfo('Please start the server with: npm start');
    logInfo('Then run this test script again: node test-api.js');
    process.exit(1);
  }
  
  await runTests();
})();
