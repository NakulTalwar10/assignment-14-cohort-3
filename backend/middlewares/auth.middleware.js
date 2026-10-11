import { verifyAccessToken } from "../utils/tokens.js";
import { createError } from "../utils/httpError.js";

export const authenticate = (req, res, next) => {
    const [scheme, token] = (req.get("authorization") || "").split(" ")

    if (scheme !== "Bearer" || !token) {
        return next(createError("Authentication required", 401))
    }

    try {
        const decoded = verifyAccessToken(token)
        req.user = { id: decoded.userId }
    } catch (error) {
        const message = error.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token"
        return next(createError(message, 401))
    }

    next()
}
