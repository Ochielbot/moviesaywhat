# Testing Guide

## Running Tests

### Method 1: Comprehensive Node.js Test Suite

The most thorough way to test all API endpoints:

```bash
# Make sure server is running in another terminal
npm start

# In a new terminal, run the test suite
node test-api.js
```

This will test:
- ✓ User registration
- ✓ User login
- ✓ Token verification
- ✓ User profile retrieval
- ✓ Pricing plans
- ✓ Search without authentication (should fail)
- ✓ Search with authentication (should succeed)
- ✓ Search limit enforcement
- ✓ Payment initialization
- ✓ Search reset functionality

### Method 2: Quick Shell Script Test

For a faster basic test:

```bash
# Make sure server is running
npm start

# In a new terminal
bash quick-test.sh
```

### Method 3: Manual cURL Tests

Test individual endpoints:

#### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Save the token from the response, then use it for authenticated requests:

#### Get Profile
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Perform Search
```bash
curl "http://localhost:3000/api/search?query=hello" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Get Pricing Plans
```bash
curl http://localhost:3000/api/payment/plans
```

## Testing Search Reset

To test the search reset functionality:

1. Register a new user
2. Perform searches until you hit the limit (5 for free plan)
3. Manually modify the user's `nextResetDate` in the code to a past date
4. Perform another search - it should reset the counter

Or use the test script which simulates this automatically.

## Testing Payment Flow

To test the full payment flow:

1. Get Paystack test API keys from https://dashboard.paystack.com
2. Add them to your `.env` file
3. Run the app and navigate to the pricing page
4. Select a plan
5. Use Paystack test card: `4084084084084081`
6. Verify the payment completes and your plan upgrades

## Expected Behavior

### Free Plan (Default)
- 5 searches per month
- Resets every 30 days
- No download capability

### After Upgrade
- Increased search limits
- Download capability (Pro/Unlimited)
- Search counter resets to 0

### Search Limit Reached
- API returns 403 status
- Error message: "Search limit reached"
- `upgrade: true` flag in response
- Shows next reset date

## Troubleshooting

### Server Not Running
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
Solution: Start the server with `npm start`

### Authentication Errors
```
Error: Invalid token
```
Solution: Make sure you're using a fresh token from login/register

### Payment Initialization Fails
```
Error: Payment initialization failed
```
Solution: Add valid Paystack API keys to `.env` file

## Test Data

The test suite creates temporary users with random emails to avoid conflicts.

Format: `test{timestamp}@example.com`

All test data is stored in-memory and will be cleared when the server restarts.

## Continuous Testing

For development, you can use nodemon to auto-restart the server:

```bash
npm run dev
```

Then run tests in another terminal whenever you make changes.
