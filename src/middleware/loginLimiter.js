import createRateLimiter from './rateLimiter.js';

const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again later.' }
});

export default loginLimiter;