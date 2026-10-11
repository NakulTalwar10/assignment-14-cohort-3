import { body, checkExact, param, query } from 'express-validator'

const startRule = (field, label, isUpdate) => {
    if (isUpdate) {
        return body(field).optional()
    }
    return body(field).exists({ values: "null" }).withMessage(`${label} is required`).bail()
}

const productRules = (isUpdate) => checkExact([
    startRule("name", "Name", isUpdate)
        .isString().withMessage("Name must be text").bail()
        .trim()
        .isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters"),

    startRule("description", "Description", isUpdate)
        .isString().withMessage("Description must be text").bail()
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage("Description must be between 10 and 2000 characters"),

    startRule("price", "Price", isUpdate)
        .isFloat({ min: 0, max: 10000000 }).withMessage("Price must be a number between 0 and 10,000,000").bail()
        .toFloat(),

    startRule("stock", "Stock", isUpdate)
        .isInt({ min: 0, max: 1000000 }).withMessage("Stock must be a whole number between 0 and 1,000,000").bail()
        .toInt(),

    startRule("category", "Category", isUpdate)
        .isString().withMessage("Category must be text").bail()
        .trim()
        .isLength({ min: 2, max: 60 }).withMessage("Category must be between 2 and 60 characters"),
], {
    locations: ["body"],
    message: (fields) => `Unsupported fields: ${fields.map((field) => field.path).join(", ")}`,
})

export const validateCreateProduct = productRules(false)

export const validateUpdateProduct = productRules(true)

export const validateProductId = [
    param("id").isMongoId().withMessage("Invalid product ID"),
]

export const validateProductListQuery = [
    query("page")
        .optional()
        .isInt({ min: 1, max: 100000 }).withMessage("Page must be a positive whole number")
        .toInt(),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage("Limit must be a whole number between 1 and 50")
        .toInt(),
]
