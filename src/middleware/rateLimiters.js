import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

const buildLimiter = ({ limit, windowMs, message, type }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,

    handler: (req, res, next, options) => {
      res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        type, // "auth", "query", "global"
        message,
        limit: options.limit,
        windowMs: options.windowMs,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });

export const limiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 100 : 1000,
  type: "global",
  message: "Too many requests. Please slow down.",
});

export const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 5 : 1000,
  type: "auth",
  message: "Too many login attempts. Please wait before trying again.",
});

export const queryLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  type: "query",
  message: "You are sending too many chatbot requests. Please wait a moment.",
});
