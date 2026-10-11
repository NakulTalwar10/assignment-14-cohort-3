import { afterEach, test } from "node:test"
import assert from "node:assert/strict"

import { clearRefreshCookie, setRefreshCookie } from "../utils/refreshCookie.js"

const originalEnv = { NODE_ENV: process.env.NODE_ENV, COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE }

const captureCookie = (action) => {
    const calls = []
    const res = {
        cookie: (name, value, options) => calls.push({ name, value, options }),
        clearCookie: (name, options) => calls.push({ name, options }),
    }
    action(res)
    return calls[0]
}

afterEach(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
    }
})

test("production refresh cookie is HttpOnly, Secure, SameSite=Strict, scoped to /api/auth and lasts 7 days", () => {
    process.env.NODE_ENV = "production"
    delete process.env.COOKIE_SAME_SITE

    const { name, options } = captureCookie((res) => setRefreshCookie(res, "token"))

    assert.equal(name, "refreshToken")
    assert.deepEqual(options, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
})

test("SameSite=None always forces the Secure flag", () => {
    process.env.NODE_ENV = "development"
    process.env.COOKIE_SAME_SITE = "none"

    const { options } = captureCookie((res) => setRefreshCookie(res, "token"))

    assert.equal(options.secure, true)
    assert.equal(options.sameSite, "none")
})

test("clearing the cookie uses the same path and flags so the browser removes it", () => {
    process.env.NODE_ENV = "production"
    delete process.env.COOKIE_SAME_SITE

    const { options } = captureCookie((res) => clearRefreshCookie(res))

    assert.deepEqual(options, { httpOnly: true, secure: true, sameSite: "strict", path: "/api/auth" })
})
