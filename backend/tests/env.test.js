import { afterEach, test } from "node:test"
import assert from "node:assert/strict"

import { getAllowedOrigins } from "../config/env.js"

const originalClientUrl = process.env.CLIENT_URL

afterEach(() => {
    process.env.CLIENT_URL = originalClientUrl
})

test("getAllowedOrigins trims whitespace and trailing slashes so they match the Origin header", () => {
    process.env.CLIENT_URL = "http://localhost:5173/, https://shop.example.com// "

    assert.deepEqual(getAllowedOrigins(), ["http://localhost:5173", "https://shop.example.com"])
})
