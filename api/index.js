import app from "../backend/app.js"
import connectDB from "../backend/config/db.js"
import { assertRequiredEnv } from "../backend/config/env.js"

// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json) and handled by Express.
const handler = async (req, res) => {
    try {
        assertRequiredEnv()
        await connectDB()
    } catch (error) {
        console.error("API startup failed:", error.message)
        res.statusCode = 503
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ success: false, message: "Service temporarily unavailable" }))
        return
    }

    return app(req, res)
}

export default handler
