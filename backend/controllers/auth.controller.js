import { matchedData } from 'express-validator'

import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    rotateRefreshToken,
} from '../services/auth.service.js'
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from '../utils/refreshCookie.js'

export const register = async (req, res) => {
    const { name, email, password } = matchedData(req, { locations: ['body'] })
    const user = await registerUser({ name, email, password })

    res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: { user },
    })
}

export const login = async (req, res) => {
    const { email, password } = matchedData(req, { locations: ['body'] })
    const { user, accessToken, refreshToken } = await loginUser({ email, password })

    setRefreshCookie(res, refreshToken)

    res.json({
        success: true,
        message: "Logged in successfully",
        data: { user, accessToken },
    })
}

export const refreshToken = async (req, res) => {
    let tokens

    try {
        tokens = await rotateRefreshToken(req.cookies[REFRESH_COOKIE_NAME])
    } catch (error) {
        if (error.statusCode === 401 || error.statusCode === 403) {
            clearRefreshCookie(res)
        }
        throw error
    }

    setRefreshCookie(res, tokens.refreshToken)

    res.json({
        success: true,
        message: "Access token refreshed",
        data: { accessToken: tokens.accessToken },
    })
}

export const logout = async (req, res) => {
    await logoutUser(req.user.id, req.cookies[REFRESH_COOKIE_NAME])

    clearRefreshCookie(res)

    res.json({
        success: true,
        message: "Logged out successfully",
    })
}

export const getMe = async (req, res) => {
    const user = await getCurrentUser(req.user.id)

    res.json({
        success: true,
        data: { user },
    })
}
