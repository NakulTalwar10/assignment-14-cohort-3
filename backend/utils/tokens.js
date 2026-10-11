import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'

const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"
const SIGNING_ALGORITHM = "HS256"

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId: userId.toString() },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: SIGNING_ALGORITHM }
    )
}

export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId: userId.toString() },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: SIGNING_ALGORITHM, jwtid: randomUUID() }
    )
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { algorithms: [SIGNING_ALGORITHM] })
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, { algorithms: [SIGNING_ALGORITHM] })
}
