// middleware/rateLimitMiddleware.js
// Simple in-memory rate limiting for authentication endpoints

class RateLimiter {
  constructor() {
    this.clients = new Map(); // IP -> { requests: [], blocked: false, blockUntil: null }
    // Don't run cleanup interval in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }
  }

  // Clean up old entries to prevent memory leaks
  cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.clients) {
      // Remove old requests (older than window)
      data.requests = data.requests.filter(time => now - time < this.windowMs);
      
      // Unblock if block period expired
      if (data.blocked && data.blockUntil && now > data.blockUntil) {
        data.blocked = false;
        data.blockUntil = null;
      }
      
      // Remove empty entries
      if (data.requests.length === 0 && !data.blocked) {
        this.clients.delete(ip);
      }
    }
  }

  // Create rate limit middleware
  create(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 5, // 5 requests per window
      blockDurationMs = 30 * 60 * 1000, // 30 minutes block
      message = 'Too many requests, please try again later.',
      skipSuccessfulRequests = false,
      keyGenerator = (req) => req.ip,
      skip = () => false
    } = options;

    this.windowMs = windowMs;

    return (req, res, next) => {
      if (skip(req)) {
        return next();
      }

      const key = keyGenerator(req);
      const now = Date.now();
      
      // Initialize client data if not exists
      if (!this.clients.has(key)) {
        this.clients.set(key, { requests: [], blocked: false, blockUntil: null });
      }
      
      const clientData = this.clients.get(key);
      
      // Check if client is currently blocked
      if (clientData.blocked && clientData.blockUntil && now < clientData.blockUntil) {
        const remainingMs = clientData.blockUntil - now;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        
        return res.status(429).json({
          error: `${message} Please try again in ${remainingMinutes} minutes.`,
          retryAfter: Math.ceil(remainingMs / 1000),
          blocked: true
        });
      }
      
      // Remove old requests outside the window
      clientData.requests = clientData.requests.filter(time => now - time < windowMs);
      
      // Check if limit exceeded
      if (clientData.requests.length >= maxRequests) {
        // Block the client
        clientData.blocked = true;
        clientData.blockUntil = now + blockDurationMs;
        
        // Use logger instead of console.warn
        const { logRateLimit } = require('../utils/logger');
        logRateLimit(key, req.path, {
          requests: clientData.requests.length,
          maxRequests,
          blockDurationMinutes: blockDurationMs/60000
        });
        
        return res.status(429).json({
          error: `${message} Too many failed attempts. You are now blocked for ${blockDurationMs/60000} minutes.`,
          retryAfter: Math.ceil(blockDurationMs / 1000),
          blocked: true
        });
      }
      
      // Add current request timestamp
      clientData.requests.push(now);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.requests.length),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
      });
      
      // If this is a failed authentication, keep the request in the list
      // If it's successful and skipSuccessfulRequests is true, remove it
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          // Check if this was a successful response (2xx status)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Remove the last request from the list (successful login)
            clientData.requests.pop();
          }
          return originalSend.call(this, data);
        };
      }
      
      next();
    };
  }

  // Get current stats (for monitoring)
  getStats() {
    const now = Date.now();
    const stats = {
      totalClients: this.clients.size,
      blockedClients: 0,
      activeClients: 0
    };
    
    for (const [ip, data] of this.clients) {
      if (data.blocked && data.blockUntil && now < data.blockUntil) {
        stats.blockedClients++;
      }
      if (data.requests.length > 0) {
        stats.activeClients++;
      }
    }
    
    return stats;
  }

  // Clear all rate limit data (for testing)
  clear() {
    this.clients.clear();
  }

  // Manually unblock a client (for admin actions)
  unblock(key) {
    if (this.clients.has(key)) {
      const clientData = this.clients.get(key);
      clientData.blocked = false;
      clientData.blockUntil = null;
      clientData.requests = [];
      return true;
    }
    return false;
  }
}

// Create global rate limiter instance
const rateLimiter = new RateLimiter();

// Predefined rate limiters for different use cases
const authRateLimit = rateLimiter.create({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per window (increased from 5)
  blockDurationMs: 5 * 60 * 1000, // 5 minutes block (reduced from 30)
  message: 'Too many authentication attempts.',
  skipSuccessfulRequests: true // Don't count successful logins against the limit
});

const strictAuthRateLimit = rateLimiter.create({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3, // 3 attempts per window
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
  message: 'Too many failed authentication attempts.',
  skipSuccessfulRequests: true
});

const generalApiRateLimit = rateLimiter.create({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  message: 'API rate limit exceeded.'
});

const publicApiRateLimit = rateLimiter.create({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute for public endpoints
  blockDurationMs: 2 * 60 * 1000, // 2 minutes block
  message: 'Public API rate limit exceeded.'
});

module.exports = {
  RateLimiter,
  rateLimiter,
  authRateLimit,
  strictAuthRateLimit,
  generalApiRateLimit,
  publicApiRateLimit
};