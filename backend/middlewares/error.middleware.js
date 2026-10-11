import { createError } from "../utils/httpError.js";

const formatError = (error) => {
    if (error.statusCode) {
        return { statusCode: error.statusCode, message: error.message, errors: error.errors }
    }

    if (error.type === "entity.parse.failed") {
        return { statusCode: 400, message: "Request body contains invalid JSON" }
    }

    if (error.type === "entity.too.large") {
        return { statusCode: 413, message: "Request body is too large" }
    }

    if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }))
        return { statusCode: 400, message: "Validation failed", errors }
    }

    if (error.name === "CastError") {
        return { statusCode: 400, message: `Invalid value for ${error.path}` }
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || "field"
        const message = `${field} already exists`
        return { statusCode: 409, message, errors: [{ field, message }] }
    }

    return { statusCode: 500, message: "Internal server error" }
}

export const notFound = (req, res, next) => {
    next(createError(`Route ${req.method} ${req.originalUrl} not found`, 404))
}

export const errorHandler = (error, req, res, next) => {
    const { statusCode, message, errors } = formatError(error)

    if (statusCode >= 500) {
        console.error(`${req.method} ${req.originalUrl} failed:`, error.message)
    }

    res.status(statusCode).json({ success: false, message, errors })
}
