import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,               // max 100 requests per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,                // max 10 requests per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

export { limiter, authLimiter }