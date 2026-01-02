import rateLimit from 'express-rate-limit'

const isProd = process.env.NODE_ENV === "production";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProd
    ? 100    
    : 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProd
    ? 5    
    : 1000,          
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

export { limiter, authLimiter }