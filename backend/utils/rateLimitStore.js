import LoginAttempt from "../models/loginAttempt.model.js";

// express-rate-limit store backed by MongoDB, so every serverless instance shares the same counters.
export const createMongoRateLimitStore = () => {
    let windowMs

    const increment = async (key) => {
        const now = new Date()

        const current = await LoginAttempt.findOneAndUpdate(
            { key, resetAt: { $gt: now } },
            { $inc: { hits: 1 } },
            { returnDocument: "after" }
        ).lean()

        if (current) {
            return { totalHits: current.hits, resetTime: current.resetAt }
        }

        const resetTime = new Date(now.getTime() + windowMs)

        try {
            await LoginAttempt.updateOne({ key }, { $set: { hits: 1, resetAt: resetTime } }, { upsert: true })
        } catch (error) {
            if (error.code === 11000) return increment(key)
            throw error
        }

        return { totalHits: 1, resetTime }
    }

    return {
        init: (options) => {
            windowMs = options.windowMs
        },
        increment,
        decrement: async (key) => {
            await LoginAttempt.updateOne({ key, hits: { $gt: 0 } }, { $inc: { hits: -1 } })
        },
        resetKey: async (key) => {
            await LoginAttempt.deleteOne({ key })
        },
    }
}
