# MovieSayWhat - Setup Guide

## Features Implemented

✅ User Authentication (Login/Register)
✅ 3 Pricing Tiers with Paystack Integration
✅ Search Limit Tracking
✅ Downloadable Video Windows (Pro & Unlimited plans)
✅ User Profile Management

## Pricing Plans

1. **Free** - $0/month
   - 5 searches/month
   - Standard video playback
   - Resets every 30 days

2. **Basic** - $5/month
   - 50 searches/month
   - Standard video playback
   - Resets every 30 days

3. **Pro** - $15/month
   - 200 searches/month
   - Downloadable videos
   - Priority support
   - Resets every 30 days

4. **Unlimited** - $30/month
   - Unlimited searches
   - Downloadable videos
   - Priority support
   - API access

## Search Reset System

Searches automatically reset every 30 days from:
- Account creation (for free users)
- Plan upgrade date (for paid users)

The system checks on every search and profile view if the reset date has passed, and automatically resets the counter.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here

# JWT Secret
JWT_SECRET=your_random_jwt_secret_here

# Session Secret
SESSION_SECRET=your_random_session_secret_here
```

### 3. Get Paystack API Keys

1. Sign up at [Paystack](https://dashboard.paystack.com/)
2. Go to Settings > API Keys & Webhooks
3. Copy your Test Secret Key and Test Public Key
4. Add them to your `.env` file

### 4. Run the Application

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing the API

Run the comprehensive test suite:

```bash
node test-api.js
```

This will test:
- User registration and login
- Token verification
- User profile retrieval
- Pricing plans
- Search authentication
- Search limit enforcement
- Payment initialization
- Search reset functionality

Make sure the server is running before running tests.

## How It Works

### Authentication Flow

1. Users register with name, email, and password
2. Passwords are hashed with bcrypt
3. JWT tokens are issued for authentication
4. Tokens are stored in localStorage

### Payment Flow

1. User selects a pricing plan
2. Payment is initialized with Paystack
3. User is redirected to Paystack payment page
4. After payment, user is redirected back with reference
5. Payment is verified and user plan is upgraded

### Search Limits

- Free: 5 searches/month
- Basic: 50 searches/month
- Pro: 200 searches/month
- Unlimited: No limit (-1)

Each search increments the counter. When limit is reached, users are prompted to upgrade.

Searches automatically reset every 30 days from the account creation or plan upgrade date.

### Download Feature

Pro and Unlimited users can open videos in a new window for easier downloading/viewing.

## Production Deployment

### Important Changes for Production

1. **Database**: Replace in-memory storage with a real database (MongoDB, PostgreSQL, etc.)
2. **Session Store**: Use Redis or database-backed session store
3. **HTTPS**: Enable secure cookies in production
4. **Environment**: Use production Paystack keys
5. **Security**: Add rate limiting, CORS restrictions, input validation

### Vercel Deployment

The app is configured for Vercel with `vercel.json`. Deploy with:

```bash
vercel
```

Make sure to add environment variables in Vercel dashboard.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Payment
- `GET /api/payment/plans` - Get pricing plans
- `POST /api/payment/initialize` - Initialize payment
- `GET /api/payment/verify/:reference` - Verify payment

### User
- `GET /api/user/profile` - Get user profile
- `POST /api/user/increment-search` - Increment search count

### Search
- `GET /api/search?query=...` - Search for dialogue (requires auth)

## Notes

- User data is stored in-memory (resets on server restart)
- For production, implement proper database storage
- Test payments use Paystack test mode
- JWT tokens expire after 7 days

## Support

For issues or questions, check the Paystack documentation:
- [Paystack Docs](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api)
