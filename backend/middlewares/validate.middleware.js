import { validationResult } from 'express-validator'

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array({ onlyFirstError: true }).map(({ path, msg }) => ({
                field: path || "body",
                message: msg
            }))
        })
    }

    next()
}
