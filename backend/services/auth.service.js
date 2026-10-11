import bcrypt from "bcryptjs";
import { createHash } from "node:crypto"
import jwt from "jsonwebtoken"

import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { createError } from "../utils/httpError.js";

const PASSWORD_SALT_ROUNDS = 12
const CONCURRENT_REFRESH_GRACE_MS = 15 * 1000
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-safe-placeholder", PASSWORD_SALT_ROUNDS)

const hashToken = (token) => {
    return createHash("sha256").update(token).digest("hex")
}

const toSafeUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
})

const createSession = async (userId) => {
    const refreshToken = generateRefreshToken(userId)
    const { exp } = jwt.decode(refreshToken)

    await Session.create({
        user: userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(exp * 1000)
    })

    return refreshToken
}

export const registerUser = async ({
    name,
    email,
    password
}) => {
    const existingUser = await User.exists({ email })

    if (existingUser) {
        throw createError("Email is already registered", 409, [
            { field: "email", message: "Email is already registered" },
        ]);
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    try {
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        return toSafeUser(user)
    } catch (error) {
        if (error.code === 11000) {
            throw createError("Email is already registered", 409, [
                { field: "email", message: "Email is already registered" },
            ]);
        }

        throw error;
    }
}

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select("+password")

    const isPasswordValid = await bcrypt.compare(
        password,
        user?.password ?? DUMMY_PASSWORD_HASH
    )

    if (!user || !isPasswordValid) {
        throw createError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await createSession(user._id);

    return {
        user: toSafeUser(user),
        accessToken,
        refreshToken,
    };
};

export const rotateRefreshToken = async (refreshToken) => {
    if (!refreshToken) {
        throw createError("Refresh token is required", 401);
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw createError("Invalid or expired refresh token", 401);
    }

    const userId = decoded.userId;
    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    const session = await Session.findOneAndUpdate(
        { tokenHash, user: userId, revokedAt: null, expiresAt: { $gt: now } },
        { $set: { revokedAt: now, rotatedAt: now } }
    );

    if (!session) {
        const reusedSession = await Session.findOne({ tokenHash, user: userId, revokedAt: { $ne: null } }).lean();

        // Another tab rotated this token a moment ago; the browser already holds the new cookie, so ask the client to retry.
        if (reusedSession?.rotatedAt > new Date(now.getTime() - CONCURRENT_REFRESH_GRACE_MS)) {
            throw createError("Session was refreshed by another request. Please retry.", 409);
        }

        if (reusedSession) {
            await Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: now } });
            throw createError("Refresh token reuse detected. Please log in again.", 403);
        }

        throw createError("Refresh session is invalid, expired, or revoked", 401);
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
        throw createError("Invalid refresh token", 401);
    }

    return {
        accessToken: generateAccessToken(userId),
        refreshToken: await createSession(userId),
    };
};

export const logoutUser = async (userId, refreshToken) => {
    if (!refreshToken) {
        return;
    }

    await Session.updateOne(
        {
            tokenHash: hashToken(refreshToken),
            user: userId,
            revokedAt: null,
        },
        {
            $set: { revokedAt: new Date() },
        }
    );
};

export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createError("User not found", 404);
    }

    return toSafeUser(user);
};
