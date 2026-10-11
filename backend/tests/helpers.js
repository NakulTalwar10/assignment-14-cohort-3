import "dotenv/config"
import { once } from "node:events"
import mongoose from "mongoose"

export const TEST_ORIGIN = "http://localhost:5173"

const prepareTestEnvironment = (suiteName) => {
    const baseDbName = process.env.dbName || "small_ecommerce"
    process.env.NODE_ENV = "test"
    process.env.dbName = `${baseDbName}_${suiteName}_test`
    process.env.CLIENT_URL = TEST_ORIGIN
    process.env.ACCESS_TOKEN_SECRET ||= "test-access-token-secret"
    process.env.REFRESH_TOKEN_SECRET ||= "test-refresh-token-secret"
}

const resetDatabase = async () => {
    if (!mongoose.connection.name.endsWith("_test")) {
        throw new Error(`Refusing to reset non-test database "${mongoose.connection.name}"`)
    }
    await mongoose.connection.dropDatabase()
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()))
}

export const startTestServer = async (suiteName) => {
    prepareTestEnvironment(suiteName)

    const { default: app } = await import("../app.js")
    const { default: connectDB } = await import("../config/db.js")

    await connectDB()
    await resetDatabase()

    const server = app.listen(0)
    await once(server, "listening")

    const baseUrl = `http://127.0.0.1:${server.address().port}`

    const stop = async () => {
        server.close()
        await mongoose.connection.dropDatabase()
        await mongoose.disconnect()
    }

    return { baseUrl, stop, resetDatabase }
}

export const createApiClient = (baseUrl) => async (path, { method = "GET", body, token, cookie, origin } = {}) => {
    const headers = {}

    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (token) headers.Authorization = `Bearer ${token}`
    if (cookie) headers.Cookie = cookie
    if (origin) headers.Origin = origin

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    })

    return {
        status: response.status,
        body: await response.json().catch(() => null),
        setCookies: response.headers.getSetCookie(),
    }
}

export const findRefreshCookie = (setCookies) =>
    setCookies.find((cookie) => cookie.startsWith("refreshToken="))

export const toCookieHeader = (setCookie) => setCookie.split(";")[0]

export const VALID_PASSWORD = "Str0ngPassword"

export const buildUser = (overrides = {}) => ({
    name: "Test User",
    email: `user${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`,
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    ...overrides,
})

export const registerAndLogin = async (request, overrides) => {
    const user = buildUser(overrides)
    await request("/api/auth/register", { method: "POST", body: user })
    const response = await request("/api/auth/login", {
        method: "POST",
        body: { email: user.email, password: user.password },
    })

    return {
        user,
        accessToken: response.body.data.accessToken,
        refreshCookie: toCookieHeader(findRefreshCookie(response.setCookies)),
    }
}
