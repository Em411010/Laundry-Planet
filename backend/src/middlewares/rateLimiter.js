import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create rate limiters with different configurations
const createRateLimiter = (requests, window, prefix = 'ratelimit') => {
  if (!redis) {
    console.warn('⚠️ Upstash Redis not configured - rate limiting disabled');
    return null;
  }
  
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix,
  });
};

// Different rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limit for authentication endpoints (5 requests per 15 minutes)
  auth: createRateLimiter(5, '15 m', 'ratelimit:auth'),
  
  // Moderate rate limit for registration and OTP (3 attempts per 15 minutes)
  register: createRateLimiter(3, '15 m', 'ratelimit:register'),
  
  // OTP verification (10 attempts per 15 minutes)
  verifyOTP: createRateLimiter(10, '15 m', 'ratelimit:verify'),
  
  // Resend OTP (3 requests per 10 minutes)
  resendOTP: createRateLimiter(3, '10 m', 'ratelimit:resend'),
  
  // Forgot password (3 requests per 15 minutes)
  forgotPassword: createRateLimiter(3, '15 m', 'ratelimit:forgot'),
  
  // Reset password (5 attempts per 15 minutes)
  resetPassword: createRateLimiter(5, '15 m', 'ratelimit:reset'),
  
  // General API rate limit (100 requests per minute)
  api: createRateLimiter(100, '1 m', 'ratelimit:api'),
  
  // Order creation (20 requests per hour)
  createOrder: createRateLimiter(20, '1 h', 'ratelimit:order'),
};

// Middleware factory to apply rate limiting
export const rateLimit = (limiterType = 'api') => {
  return async (req, res, next) => {
    const limiter = rateLimiters[limiterType];
    
    // If rate limiter not configured, skip rate limiting
    if (!limiter) {
      return next();
    }
    
    try {
      // Use IP address as identifier, fallback to 'anonymous'
      const identifier = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'anonymous';
      
      // Check rate limit
      const { success, limit, reset, remaining } = await limiter.limit(identifier);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString());
      
      if (!success) {
        const resetDate = new Date(reset);
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        
        res.setHeader('Retry-After', retryAfter);
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          error: 'Rate limit exceeded',
          retryAfter: resetDate.toISOString(),
          limit,
          remaining: 0
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to proceed (fail open)
      next();
    }
  };
};

// Get identifier from request (for logging/analytics)
export const getIdentifier = (req) => {
  // Try to get user ID if authenticated
  if (req.userId) {
    return `user:${req.userId}`;
  }
  
  // Otherwise use IP address
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'anonymous';
};
