import { matchedData } from 'express-validator'

import Product from '../models/product.model.js'
import { createError } from '../utils/httpError.js'

export const createProduct = async (req, res) => {
    const product = await Product.create(matchedData(req, { locations: ['body'] }))

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: { product },
    })
}

export const getProducts = async (req, res) => {
    const { page = 1, limit = 12 } = matchedData(req, { locations: ['query'] })

    const [products, total] = await Promise.all([
        Product.find()
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Product.countDocuments(),
    ])

    res.json({
        success: true,
        data: {
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
    })
}

export const getProduct = async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (!product) {
        throw createError("Product not found", 404)
    }

    res.json({
        success: true,
        data: { product },
    })
}

export const updateProduct = async (req, res) => {
    const updates = matchedData(req, { locations: ['body'] })

    if (Object.keys(updates).length === 0) {
        throw createError("Provide at least one field to update", 400)
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    )

    if (!product) {
        throw createError("Product not found", 404)
    }

    res.json({
        success: true,
        message: "Product updated successfully",
        data: { product },
    })
}

export const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
        throw createError("Product not found", 404)
    }

    res.json({
        success: true,
        message: "Product deleted successfully",
    })
}
