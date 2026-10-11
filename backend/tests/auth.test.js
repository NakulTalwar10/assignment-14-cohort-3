import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import {
    TEST_ORIGIN,
    VALID_PASSWORD,
    buildUser,
    createApiClient,
    findRefreshCookie,
    registerAndLogin,
    startTestServer,
    toCookieHeader,
} from "./helpers.js"

let server
let request
let User
let Session

const fieldsOf = (body) => body.errors.map(({ field }) => field)

const refresh = (cookie) => request("/api/auth/refresh-token", { method: "POST", cookie })

const tokenFromCookie = (cookie) => decodeURIComponent(cookie.split("=")[1])

const tokenHashOf = (cookie) => createHash("sha256").update(tokenFromCookie(cookie)).digest("hex")

const rotatedAgo = (cookie, ms) => {
    const at = new Date(Date.now() - ms)
    return Session.updateOne({ tokenHash: tokenHashOf(cookie) }, { $set: { revokedAt: at, rotatedAt: at } })
}

const activeSessionCount = (cookie) =>
    Session.countDocuments({ revokedAt: null, user: jwt.decode(tokenFromCookie(cookie)).userId })

before(async () => {
    server = await startTestServer("auth")
    request = createApiClient(server.baseUrl)
    User = (await import("../models/user.model.js")).default
    Session = (await import("../models/session.model.js")).default
})

after(async () => {
    await server.stop()
})

describe("POST /api/auth/register", () => {
    test("creates a user and returns a safe profile without tokens", async () => {
        const user = buildUser({ email: "  New.User@Example.COM " })
        const response = await request("/api/auth/register", { method: "POST", body: user })

        assert.equal(response.status, 201)
        assert.equal(response.body.success, true)
        assert.equal(response.body.data.user.email, "new.user@example.com")
        assert.equal(response.body.data.user.name, user.name)
        assert.ok(response.body.data.user.id)
        assert.equal(response.body.data.user.password, undefined)
        assert.equal(response.body.data.accessToken, undefined)
        assert.equal(findRefreshCookie(response.setCookies), undefined)
    })

    test("stores a bcrypt hash instead of the plaintext password", async () => {
        const user = buildUser()
        await request("/api/auth/register", { method: "POST", body: user })

        const stored = await User.findOne({ email: user.email }).select("+password").lean()

        assert.notEqual(stored.password, user.password)
        assert.match(stored.password, /^\$2[aby]\$12\$/)
        assert.equal(await bcrypt.compare(user.password, stored.password), true)
    })

    test("rejects missing fields with field-level errors", async () => {
        const response = await request("/api/auth/register", { method: "POST", body: {} })

        assert.equal(response.status, 400)
        assert.equal(response.body.success, false)
        assert.deepEqual(fieldsOf(response.body).sort(), ["confirmPassword", "email", "name", "password"])
    })

    test("rejects an invalid email and a weak password", async () => {
        const response = await request("/api/auth/register", {
            method: "POST",
            body: buildUser({ email: "not-an-email", password: "weakpass", confirmPassword: "weakpass" }),
        })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["email", "password"])
    })

    test("rejects mismatched password confirmation", async () => {
        const response = await request("/api/auth/register", {
            method: "POST",
            body: buildUser({ confirmPassword: "Different123" }),
        })

        assert.equal(response.status, 400)
        assert.deepEqual(response.body.errors, [{ field: "confirmPassword", message: "Passwords do not match" }])
    })

    test("rejects duplicate emails case-insensitively with 409", async () => {
        const user = buildUser()
        await request("/api/auth/register", { method: "POST", body: user })

        const response = await request("/api/auth/register", {
            method: "POST",
            body: { ...user, email: user.email.toUpperCase() },
        })

        assert.equal(response.status, 409)
        assert.equal(response.body.errors[0].field, "email")
    })

    test("enforces email uniqueness at the database level", async () => {
        const indexes = await User.collection.indexes()
        const emailIndex = indexes.find((index) => index.key.email === 1)

        assert.equal(emailIndex?.unique, true)
    })

    test("rejects malformed JSON with 400", async () => {
        const response = await request("/api/auth/register", { method: "POST", body: "{bad json" })

        assert.equal(response.status, 400)
        assert.equal(response.body.success, false)
    })

    test("rejects requests from untrusted origins", async () => {
        const response = await request("/api/auth/register", {
            method: "POST",
            body: buildUser(),
            origin: "https://evil.example",
        })

        assert.equal(response.status, 403)
    })

    test("accepts same-origin requests and rejects a different port on the same host", async () => {
        const sameOrigin = await request("/api/auth/register", {
            method: "POST",
            body: buildUser(),
            origin: server.baseUrl,
        })
        const otherPort = await request("/api/auth/register", {
            method: "POST",
            body: buildUser(),
            origin: "http://127.0.0.1:1",
        })

        assert.equal(sameOrigin.status, 201)
        assert.equal(otherPort.status, 403)
    })
})

describe("POST /api/auth/login", () => {
    test("returns an access token and sets a secure httpOnly refresh cookie", async () => {
        const user = buildUser()
        await request("/api/auth/register", { method: "POST", body: user })

        const response = await request("/api/auth/login", {
            method: "POST",
            body: { email: user.email.toUpperCase(), password: user.password },
            origin: TEST_ORIGIN,
        })

        assert.equal(response.status, 200)
        assert.equal(response.body.data.user.email, user.email)
        assert.equal(response.body.data.user.name, user.name)
        assert.equal(response.body.data.refreshToken, undefined)

        const decoded = jwt.verify(response.body.data.accessToken, process.env.ACCESS_TOKEN_SECRET)
        assert.equal(decoded.exp - decoded.iat, 15 * 60)

        const cookie = findRefreshCookie(response.setCookies)
        assert.ok(cookie)
        assert.match(cookie, /HttpOnly/i)
        assert.match(cookie, /SameSite=Strict/i)
        assert.match(cookie, /Path=\/api\/auth/i)
        assert.match(cookie, /Max-Age=604800/i)

        const refreshToken = decodeURIComponent(toCookieHeader(cookie).split("=")[1])
        const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        assert.equal(refreshDecoded.exp - refreshDecoded.iat, 7 * 24 * 60 * 60)

        const tokenHash = createHash("sha256").update(refreshToken).digest("hex")
        const session = await Session.findOne({ tokenHash }).lean()
        assert.ok(session)
        assert.equal(session.user.toString(), response.body.data.user.id)
        assert.equal(await Session.exists({ tokenHash: refreshToken }), null)
    })

    test("returns a generic 401 for a wrong password", async () => {
        const user = buildUser()
        await request("/api/auth/register", { method: "POST", body: user })

        const response = await request("/api/auth/login", {
            method: "POST",
            body: { email: user.email, password: "WrongPass123" },
        })

        assert.equal(response.status, 401)
        assert.equal(response.body.message, "Invalid email or password")
    })

    test("returns the same generic 401 for an unknown email", async () => {
        const response = await request("/api/auth/login", {
            method: "POST",
            body: { email: "nobody@example.com", password: VALID_PASSWORD },
        })

        assert.equal(response.status, 401)
        assert.equal(response.body.message, "Invalid email or password")
    })

    test("rejects invalid login input with 400", async () => {
        const response = await request("/api/auth/login", {
            method: "POST",
            body: { email: "bad", password: "" },
        })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["email", "password"])
    })
})

describe("GET /api/auth/me and access token middleware", () => {
    test("returns the current user for a valid access token", async () => {
        const { user, accessToken } = await registerAndLogin(request)
        const response = await request("/api/auth/me", { token: accessToken })

        assert.equal(response.status, 200)
        assert.equal(response.body.data.user.email, user.email)
        assert.deepEqual(Object.keys(response.body.data.user).sort(), ["createdAt", "email", "id", "name", "updatedAt"])
    })

    test("rejects a missing token", async () => {
        const response = await request("/api/auth/me")

        assert.equal(response.status, 401)
        assert.equal(response.body.message, "Authentication required")
    })

    test("rejects a malformed authorization header", async () => {
        const response = await fetch(`${server.baseUrl}/api/auth/me`, {
            headers: { Authorization: "Token abc" },
        })

        assert.equal(response.status, 401)
    })

    test("rejects a token signed with the wrong secret", async () => {
        const forged = jwt.sign({ userId: "64b7f0c2a1b2c3d4e5f60718" }, "wrong-secret", { expiresIn: "15m" })
        const response = await request("/api/auth/me", { token: forged })

        assert.equal(response.status, 401)
        assert.equal(response.body.message, "Invalid access token")
    })

    test("rejects a refresh token used as an access token", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const refreshToken = decodeURIComponent(refreshCookie.split("=")[1])
        const response = await request("/api/auth/me", { token: refreshToken })

        assert.equal(response.status, 401)
    })

    test("rejects an expired access token", async () => {
        const { accessToken } = await registerAndLogin(request)
        const { userId } = jwt.decode(accessToken)
        const expired = jwt.sign(
            { userId, exp: Math.floor(Date.now() / 1000) - 60 },
            process.env.ACCESS_TOKEN_SECRET
        )
        const response = await request("/api/auth/me", { token: expired })

        assert.equal(response.status, 401)
        assert.equal(response.body.message, "Access token expired")
    })
})

describe("POST /api/auth/refresh-token", () => {
    test("issues a new access token and rotates the refresh token", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const response = await refresh(refreshCookie)

        assert.equal(response.status, 200)
        assert.ok(response.body.data.accessToken)

        const rotatedCookie = toCookieHeader(findRefreshCookie(response.setCookies))
        assert.notEqual(rotatedCookie, refreshCookie)

        const me = await request("/api/auth/me", { token: response.body.data.accessToken })
        assert.equal(me.status, 200)

        const nextRefresh = await refresh(rotatedCookie)
        assert.equal(nextRefresh.status, 200)
    })

    test("rejects a request without a refresh cookie", async () => {
        const response = await refresh()

        assert.equal(response.status, 401)
    })

    test("rejects an invalid refresh token", async () => {
        const response = await refresh("refreshToken=not-a-jwt")

        assert.equal(response.status, 401)
        assert.match(findRefreshCookie(response.setCookies), /Expires=Thu, 01 Jan 1970/)
    })

    test("rejects an expired refresh token", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const { userId } = jwt.decode(decodeURIComponent(refreshCookie.split("=")[1]))
        const expired = jwt.sign(
            { userId, exp: Math.floor(Date.now() / 1000) - 60 },
            process.env.REFRESH_TOKEN_SECRET
        )

        const response = await refresh(`refreshToken=${expired}`)

        assert.equal(response.status, 401)
    })

    test("rejects a validly signed token without a server-side session", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const { userId } = jwt.decode(decodeURIComponent(refreshCookie.split("=")[1]))
        const unknown = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d", jwtid: "unknown" })

        const response = await refresh(`refreshToken=${unknown}`)

        assert.equal(response.status, 401)
    })

    test("rejects a session that has expired server-side", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const token = decodeURIComponent(refreshCookie.split("=")[1])
        const tokenHash = createHash("sha256").update(token).digest("hex")
        await Session.updateOne({ tokenHash }, { $set: { expiresAt: new Date(Date.now() - 1000) } })

        const response = await refresh(refreshCookie)

        assert.equal(response.status, 401)
    })

    test("detects reuse of a rotated token and revokes every session for that user", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const firstRotation = await refresh(refreshCookie)
        const rotatedCookie = toCookieHeader(findRefreshCookie(firstRotation.setCookies))
        await rotatedAgo(refreshCookie, 60 * 1000)

        const reuse = await refresh(refreshCookie)
        assert.equal(reuse.status, 403)

        const afterReuse = await refresh(rotatedCookie)
        assert.ok([401, 403].includes(afterReuse.status))

        assert.equal(await activeSessionCount(refreshCookie), 0)
    })

    test("concurrent refreshes from several tabs keep the session alive without issuing extra tokens", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const responses = await Promise.all([refresh(refreshCookie), refresh(refreshCookie), refresh(refreshCookie)])
        const winner = responses.find(({ status }) => status === 200)
        const losers = responses.filter(({ status }) => status !== 200)

        assert.ok(winner)
        assert.deepEqual(losers.map(({ status }) => status), [409, 409])
        for (const loser of losers) {
            assert.equal(loser.body.data, undefined)
            assert.equal(findRefreshCookie(loser.setCookies), undefined)
        }

        assert.equal(await activeSessionCount(refreshCookie), 1)

        const retry = await refresh(toCookieHeader(findRefreshCookie(winner.setCookies)))
        assert.equal(retry.status, 200)
    })

    test("a token rotated by logout is not covered by the concurrent-refresh grace period", async () => {
        const { accessToken, refreshCookie } = await registerAndLogin(request)
        await request("/api/auth/logout", { method: "POST", token: accessToken, cookie: refreshCookie })

        const response = await refresh(refreshCookie)
        assert.equal(response.status, 403)
    })
})

describe("POST /api/auth/logout", () => {
    test("requires an access token", async () => {
        const { refreshCookie } = await registerAndLogin(request)
        const response = await request("/api/auth/logout", { method: "POST", cookie: refreshCookie })

        assert.equal(response.status, 401)
    })

    test("revokes the refresh session and clears the cookie", async () => {
        const { accessToken, refreshCookie } = await registerAndLogin(request)
        const response = await request("/api/auth/logout", {
            method: "POST",
            token: accessToken,
            cookie: refreshCookie,
        })

        assert.equal(response.status, 200)
        assert.equal(response.body.success, true)

        const clearedCookie = findRefreshCookie(response.setCookies)
        assert.match(clearedCookie, /Expires=Thu, 01 Jan 1970/)
        assert.match(clearedCookie, /Path=\/api\/auth/i)

        const token = decodeURIComponent(refreshCookie.split("=")[1])
        const tokenHash = createHash("sha256").update(token).digest("hex")
        const session = await Session.findOne({ tokenHash }).lean()
        assert.ok(session.revokedAt)

        const refreshAfterLogout = await refresh(refreshCookie)
        assert.ok([401, 403].includes(refreshAfterLogout.status))
    })
})

describe("login rate limiting", () => {
    test("blocks repeated failed login attempts with 429", async () => {
        const attempt = () =>
            request("/api/auth/login", {
                method: "POST",
                body: { email: "brute@example.com", password: "WrongPass123" },
            })

        let lastResponse
        for (let index = 0; index < 12; index += 1) {
            lastResponse = await attempt()
        }

        assert.equal(lastResponse.status, 429)
        assert.equal(lastResponse.body.success, false)

        const LoginAttempt = (await import("../models/loginAttempt.model.js")).default
        const stored = await LoginAttempt.findOne().sort({ hits: -1 }).lean()
        assert.ok(stored.hits >= 10)
        assert.ok(stored.resetAt > new Date())
    })
})
