import { rateLimit } from "express-rate-limit";

import { createError } from "../utils/httpError.js";
import { createMongoRateLimitStore } from "../utils/rateLimitStore.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const DEFAULT_LOGIN_ATTEMPTS = 10

export const loginRateLimiter = rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || DEFAULT_LOGIN_ATTEMPTS,
    skipSuccessfulRequests: true,
    store: createMongoRateLimitStore(),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(createError("Too many failed login attempts. Please try again later.", 429))
    },
})

export const requireTrustedOrigin = (allowedOrigins) => (req, res, next) => {
    const origin = req.get("origin")
    const isSameOrigin = origin === `${req.protocol}://${req.get("host")}`

    if (origin && !isSameOrigin && !allowedOrigins.includes(origin)) {
        return next(createError("Request origin is not allowed", 403))
    }

    next()
}
