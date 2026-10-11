import { Router } from 'express'

import { getMe, login, logout, refreshToken, register } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { loginRateLimiter } from '../middlewares/security.middleware.js'
import { handleValidationErrors } from '../middlewares/validate.middleware.js'
import { validateLogin, validateRegister } from '../validators/auth.validators.js'

const router = Router()

router.post('/register', validateRegister, handleValidationErrors, register)
router.post('/login', loginRateLimiter, validateLogin, handleValidationErrors, login)
router.post('/refresh-token', refreshToken)
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, getMe)

export default router
