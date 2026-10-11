import { Router } from 'express'

import {
    createProduct,
    deleteProduct,
    getProduct,
    getProducts,
    updateProduct,
} from '../controllers/product.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { handleValidationErrors } from '../middlewares/validate.middleware.js'
import {
    validateCreateProduct,
    validateProductId,
    validateProductListQuery,
    validateUpdateProduct,
} from '../validators/product.validators.js'

const router = Router()

router.route('/')
    .get(validateProductListQuery, handleValidationErrors, getProducts)
    .post(authenticate, validateCreateProduct, handleValidationErrors, createProduct)

router.route('/:id')
    .get(validateProductId, handleValidationErrors, getProduct)
    .put(authenticate, validateProductId, validateUpdateProduct, handleValidationErrors, updateProduct)
    .delete(authenticate, validateProductId, handleValidationErrors, deleteProduct)

export default router
