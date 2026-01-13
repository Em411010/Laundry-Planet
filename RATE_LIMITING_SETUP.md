# Upstash Rate Limiting Setup Guide

## Overview
Rate limiting has been implemented using Upstash Redis to protect your API from abuse and ensure fair usage across all users.

## What is Rate Limiting?
Rate limiting restricts the number of requests a user can make to your API within a specific time window. This helps:
- Prevent brute force attacks
- Protect against DDoS attacks
- Ensure fair resource allocation
- Reduce server costs
- Improve overall system stability

## Rate Limits Implemented

### Authentication Endpoints
- **Login** (`/api/auth/login`): 5 requests per 15 minutes
- **Register** (`/api/auth/register`): 3 requests per 15 minutes
- **Verify OTP** (`/api/auth/verify-otp`): 10 requests per 15 minutes
- **Resend OTP** (`/api/auth/resend-otp`): 3 requests per 10 minutes

### Order Endpoints
- **Create Order**: 20 requests per hour
- **General API**: 100 requests per minute

## Setup Instructions

### 1. Create Upstash Account
1. Go to https://console.upstash.com/
2. Sign up for a free account (no credit card required)
3. Verify your email

### 2. Create Redis Database
1. After logging in, click **"Create Database"**
2. Configure your database:
   - **Name**: laundry-planet-ratelimit (or any name)
   - **Type**: Regional or Global (Regional is free)
   - **Region**: Choose closest to your server
   - **TLS**: Enabled (recommended)
3. Click **"Create"**

### 3. Get API Credentials
1. Click on your newly created database
2. Scroll to **"REST API"** section
3. Copy two values:
   - **UPSTASH_REDIS_REST_URL**: The endpoint URL
   - **UPSTASH_REDIS_REST_TOKEN**: The access token

### 4. Configure Environment Variables
Add to your `backend/.env` file:

```env
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Restart Backend Server
```bash
cd backend
npm run dev
```

## How It Works

### Request Flow
1. User makes a request to a rate-limited endpoint
2. Middleware checks Upstash Redis for request count
3. If limit not exceeded:
   - Increment counter
   - Process request
   - Return response with rate limit headers
4. If limit exceeded:
   - Return 429 (Too Many Requests) error
   - Include retry-after information

### Rate Limit Headers
Every response includes headers:
```
X-RateLimit-Limit: 5           # Maximum requests allowed
X-RateLimit-Remaining: 3       # Requests remaining
X-RateLimit-Reset: 2026-01-13T... # When limit resets
```

### When Rate Limit Exceeded
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": "Rate limit exceeded",
  "retryAfter": "2026-01-13T07:45:00.000Z",
  "limit": 5,
  "remaining": 0
}
```

## Rate Limiter Configuration

The rate limiter uses **sliding window** algorithm:
- More accurate than fixed windows
- Prevents burst traffic at window boundaries
- Distributes load evenly over time

### Available Limiters

```javascript
rateLimiters = {
  auth: 5 requests / 15 minutes,
  register: 3 requests / 15 minutes,
  verifyOTP: 10 requests / 15 minutes,
  resendOTP: 3 requests / 10 minutes,
  api: 100 requests / minute,
  createOrder: 20 requests / hour
}
```

## Testing Rate Limits

### Test Login Rate Limit
```bash
# Try logging in 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\n---"
done
```

After 5 attempts, you should see:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error": "Rate limit exceeded",
  "retryAfter": "2026-01-13T07:45:00.000Z"
}
```

## Frontend Integration

### Handling Rate Limit Errors

Update your API error handling:

```javascript
// In api.js or error handler
if (error.response?.status === 429) {
  const retryAfter = error.response.data.retryAfter;
  const message = error.response.data.message;
  
  // Show user-friendly message
  alert(`${message}\nTry again after: ${new Date(retryAfter).toLocaleString()}`);
}
```

### Display Rate Limit Info

```javascript
// Show remaining attempts
const remaining = response.headers['x-ratelimit-remaining'];
if (remaining <= 2) {
  console.warn(`Only ${remaining} attempts remaining`);
}
```

## Customizing Rate Limits

### Modify Existing Limits

Edit `backend/src/middlewares/rateLimiter.js`:

```javascript
// Change login limit to 10 requests per 30 minutes
auth: createRateLimiter(10, '30 m', 'ratelimit:auth'),

// Change order creation to 50 per hour
createOrder: createRateLimiter(50, '1 h', 'ratelimit:order'),
```

### Add New Rate Limiter

```javascript
// In rateLimiter.js
export const rateLimiters = {
  // ... existing limiters
  
  // New limiter for profile updates
  updateProfile: createRateLimiter(20, '1 h', 'ratelimit:profile'),
};

// In your route file
import { rateLimit } from '../middlewares/rateLimiter.js';

router.patch('/profile', 
  authenticate, 
  rateLimit('updateProfile'), 
  updateProfile
);
```

## Monitoring & Analytics

Upstash provides analytics through their console:
1. Go to your database in Upstash console
2. Click **"Analytics"** tab
3. View:
   - Request rates
   - Memory usage
   - Command distribution
   - Geographic distribution

## Troubleshooting

### Rate Limiting Not Working
- Check environment variables are set correctly
- Verify Upstash database is running
- Check server logs for connection errors
- Ensure Redis client is initialized

### Console Warning: "Redis not configured"
```
⚠️ Upstash Redis not configured - rate limiting disabled
```
**Solution**: Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env`

### All Requests Blocked
- Check if rate limits are too restrictive
- Verify identifier (IP address) is being captured correctly
- Clear rate limit in Upstash console or wait for window to expire

### Connection Timeouts
- Verify Upstash database is active
- Check network connectivity
- Confirm REST API credentials are correct

## Production Considerations

### Recommended Limits for Production
```javascript
// Authentication (stricter)
auth: 3 requests / 30 minutes,
register: 2 requests / 1 hour,
verifyOTP: 5 requests / 30 minutes,
resendOTP: 2 requests / 15 minutes,

// API (more generous)
api: 1000 requests / minute,
createOrder: 100 requests / hour,
```

### Use User ID for Authenticated Requests
Modify identifier logic in `rateLimiter.js`:
```javascript
const identifier = req.userId 
  ? `user:${req.userId}`  // Use user ID if authenticated
  : req.ip;                // Use IP for unauthenticated
```

### Whitelist Admin/Staff
```javascript
// In rate limit middleware
if (req.user?.role === 'admin') {
  return next(); // Skip rate limiting for admins
}
```

### Set Up Alerts
- Monitor rate limit hits in Upstash
- Set up alerts for unusual patterns
- Track blocked requests in logs

## Upstash Free Tier Limits
- **10,000 commands per day**
- **256 MB storage**
- **Single region**
- **REST API included**

Perfect for development and small production deployments.

## Cost Estimation
- Free tier: $0/month (10K commands/day)
- Pay-as-you-go: $0.20 per 100K commands
- Pro: Starting at $10/month (500K commands/day)

## Security Benefits
✅ Prevents brute force password attacks
✅ Stops OTP enumeration
✅ Limits registration spam
✅ Protects against credential stuffing
✅ Reduces server load from attacks
✅ Improves legitimate user experience

## Next Steps
1. ✅ Install Upstash packages
2. ✅ Create rate limiting middleware
3. ✅ Apply to authentication routes
4. ⏳ Set up Upstash account
5. ⏳ Configure environment variables
6. ⏳ Test rate limiting
7. ⏳ Monitor usage in production

## Additional Resources
- Upstash Documentation: https://docs.upstash.com/
- Rate Limiting Best Practices: https://upstash.com/docs/redis/features/ratelimiting
- API Reference: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
