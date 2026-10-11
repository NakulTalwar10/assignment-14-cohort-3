export const REFRESH_COOKIE_NAME = "refreshToken"

const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000

const cookieOptions = () => {
    const sameSite = process.env.COOKIE_SAME_SITE || "strict"

    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || sameSite === "none",
        sameSite,
        path: "/api/auth",
    }
}

export const setRefreshCookie = (res, refreshToken) => {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, { ...cookieOptions(), maxAge: REFRESH_TOKEN_MS })
}

export const clearRefreshCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions())
}
