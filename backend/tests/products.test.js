import { after, before, beforeEach, describe, test } from "node:test"
import assert from "node:assert/strict"

import { createApiClient, registerAndLogin, startTestServer } from "./helpers.js"

const MISSING_PRODUCT_ID = "64b7f0c2a1b2c3d4e5f60718"

let server
let request
let accessToken

const buildProduct = (overrides = {}) => ({
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with silent clicks.",
    price: 799.5,
    stock: 25,
    category: "Electronics",
    ...overrides,
})

const createProduct = async (overrides) => {
    const response = await request("/api/products", {
        method: "POST",
        token: accessToken,
        body: buildProduct(overrides),
    })
    return response.body.data.product
}

const fieldsOf = (body) => body.errors.map(({ field }) => field)

before(async () => {
    server = await startTestServer("products")
    request = createApiClient(server.baseUrl)
})

beforeEach(async () => {
    await server.resetDatabase()
    accessToken = (await registerAndLogin(request)).accessToken
})

after(async () => {
    await server.stop()
})

describe("POST /api/products", () => {
    test("creates a product when authenticated", async () => {
        const response = await request("/api/products", {
            method: "POST",
            token: accessToken,
            body: buildProduct({ price: "1299.99", stock: "4" }),
        })

        assert.equal(response.status, 201)
        assert.equal(response.body.data.product.name, "Wireless Mouse")
        assert.equal(response.body.data.product.price, 1299.99)
        assert.equal(response.body.data.product.stock, 4)
        assert.ok(response.body.data.product._id)
        assert.ok(response.body.data.product.createdAt)
    })

    test("rejects creation without authentication", async () => {
        const response = await request("/api/products", { method: "POST", body: buildProduct() })

        assert.equal(response.status, 401)
    })

    test("rejects creation with an invalid token", async () => {
        const response = await request("/api/products", {
            method: "POST",
            token: "aaa.bbb.ccc",
            body: buildProduct(),
        })

        assert.equal(response.status, 401)
    })

    test("rejects missing required fields", async () => {
        const response = await request("/api/products", { method: "POST", token: accessToken, body: {} })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["category", "description", "name", "price", "stock"])
    })

    test("rejects negative and non-numeric price and stock", async () => {
        const response = await request("/api/products", {
            method: "POST",
            token: accessToken,
            body: buildProduct({ price: -1, stock: "many" }),
        })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["price", "stock"])
    })

    test("rejects fractional stock and wrong field types", async () => {
        const response = await request("/api/products", {
            method: "POST",
            token: accessToken,
            body: buildProduct({ stock: 2.5, name: 12345 }),
        })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["name", "stock"])
    })

    test("rejects unsupported and internal fields", async () => {
        const response = await request("/api/products", {
            method: "POST",
            token: accessToken,
            body: buildProduct({ _id: MISSING_PRODUCT_ID, createdAt: "2020-01-01" }),
        })

        assert.equal(response.status, 400)
        assert.match(response.body.errors[0].message, /Unsupported fields: _id, createdAt/)
    })
})

describe("GET /api/products", () => {
    test("is public and handles an empty collection", async () => {
        const response = await request("/api/products")

        assert.equal(response.status, 200)
        assert.deepEqual(response.body.data.products, [])
        assert.deepEqual(response.body.data.pagination, { page: 1, limit: 12, total: 0, totalPages: 0 })
    })

    test("returns paginated products newest first", async () => {
        for (let index = 1; index <= 3; index += 1) {
            await createProduct({ name: `Product ${index}` })
        }

        const firstPage = await request("/api/products?page=1&limit=2")
        const secondPage = await request("/api/products?page=2&limit=2")

        assert.equal(firstPage.status, 200)
        assert.deepEqual(firstPage.body.data.products.map(({ name }) => name), ["Product 3", "Product 2"])
        assert.deepEqual(firstPage.body.data.pagination, { page: 1, limit: 2, total: 3, totalPages: 2 })
        assert.deepEqual(secondPage.body.data.products.map(({ name }) => name), ["Product 1"])
    })

    test("rejects invalid pagination parameters", async () => {
        const response = await request("/api/products?page=0&limit=500")

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["limit", "page"])
    })
})

describe("GET /api/products/:id", () => {
    test("returns a single product publicly", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`)

        assert.equal(response.status, 200)
        assert.equal(response.body.data.product._id, product._id)
    })

    test("returns 400 for a malformed id", async () => {
        const response = await request("/api/products/not-an-id")

        assert.equal(response.status, 400)
        assert.deepEqual(response.body.errors, [{ field: "id", message: "Invalid product ID" }])
    })

    test("returns 404 for a nonexistent id", async () => {
        await createProduct()
        const response = await request(`/api/products/${MISSING_PRODUCT_ID}`)

        assert.equal(response.status, 404)
        assert.equal(response.body.message, "Product not found")
    })
})

describe("PUT /api/products/:id", () => {
    test("updates supported fields when authenticated", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, {
            method: "PUT",
            token: accessToken,
            body: { price: 649, stock: 0 },
        })

        assert.equal(response.status, 200)
        assert.equal(response.body.data.product.price, 649)
        assert.equal(response.body.data.product.stock, 0)
        assert.equal(response.body.data.product.name, product.name)
    })

    test("requires authentication", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, { method: "PUT", body: { price: 1 } })

        assert.equal(response.status, 401)
    })

    test("rejects invalid update values", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, {
            method: "PUT",
            token: accessToken,
            body: { price: -10, name: "" },
        })

        assert.equal(response.status, 400)
        assert.deepEqual(fieldsOf(response.body).sort(), ["name", "price"])
    })

    test("rejects attempts to change internal fields", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, {
            method: "PUT",
            token: accessToken,
            body: { _id: MISSING_PRODUCT_ID, updatedAt: "2020-01-01" },
        })

        assert.equal(response.status, 400)

        const unchanged = await request(`/api/products/${product._id}`)
        assert.equal(unchanged.body.data.product.updatedAt, product.updatedAt)
    })

    test("rejects an empty update", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, {
            method: "PUT",
            token: accessToken,
            body: {},
        })

        assert.equal(response.status, 400)
        assert.equal(response.body.message, "Provide at least one field to update")
    })

    test("returns 400 for a malformed id and 404 for a missing product", async () => {
        const malformed = await request("/api/products/123", {
            method: "PUT",
            token: accessToken,
            body: { price: 10 },
        })
        const missing = await request(`/api/products/${MISSING_PRODUCT_ID}`, {
            method: "PUT",
            token: accessToken,
            body: { price: 10 },
        })

        assert.equal(malformed.status, 400)
        assert.equal(missing.status, 404)
    })
})

describe("DELETE /api/products/:id", () => {
    test("deletes an existing product when authenticated", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, { method: "DELETE", token: accessToken })

        assert.equal(response.status, 200)
        assert.equal(response.body.success, true)

        const lookup = await request(`/api/products/${product._id}`)
        assert.equal(lookup.status, 404)
    })

    test("requires authentication", async () => {
        const product = await createProduct()
        const response = await request(`/api/products/${product._id}`, { method: "DELETE" })

        assert.equal(response.status, 401)

        const lookup = await request(`/api/products/${product._id}`)
        assert.equal(lookup.status, 200)
    })

    test("returns 400 for a malformed id and 404 for a missing product", async () => {
        const malformed = await request("/api/products/xyz", { method: "DELETE", token: accessToken })
        const missing = await request(`/api/products/${MISSING_PRODUCT_ID}`, { method: "DELETE", token: accessToken })

        assert.equal(malformed.status, 400)
        assert.equal(missing.status, 404)
    })
})

describe("unknown routes", () => {
    test("return a consistent 404 response", async () => {
        const response = await request("/api/unknown")

        assert.equal(response.status, 404)
        assert.equal(response.body.success, false)
    })
})
