import { body } from 'express-validator'

const emailRule = () =>
    body("email")
        .exists({ values: "falsy" })
        .withMessage("Email is required")
        .bail()
        .isString()
        .withMessage("Email must be text")
        .bail()
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage("Enter a valid email")
        .isLength({ max: 254 })
        .withMessage("Email must be at most 254 characters")

export const validateRegister = [
    body("name")
        .exists({ values: "falsy" })
        .withMessage("Name is required")
        .bail()
        .isString()
        .withMessage("Name must be text")
        .bail()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters"),

    emailRule(),

    body("password")
        .exists({ values: "falsy" })
        .withMessage("Password is required")
        .bail()
        .isString()
        .withMessage("Password must be text")
        .bail()
        .isLength({ min: 8, max: 128 })
        .withMessage("Password must be 8-128 characters")
        .bail()
        .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
        .withMessage("Password must include an uppercase letter, a lowercase letter, and a number"),

    body("confirmPassword")
        .exists({ values: "falsy" })
        .withMessage("Please confirm your password")
        .bail()
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match"),
]

export const validateLogin = [
    emailRule(),

    body("password")
        .exists({ values: "falsy" })
        .withMessage("Password is required")
        .bail()
        .isString()
        .withMessage("Password must be text")
        .bail()
        .isLength({ max: 128 })
        .withMessage("Password must be at most 128 characters"),
]
