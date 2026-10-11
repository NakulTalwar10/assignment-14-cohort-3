import "dotenv/config"
import app from "./app.js"
import connectDB from "./config/db.js";
import { assertRequiredEnv } from "./config/env.js";

const Port = process.env.PORT || 5000

const startServer = async () => {
    try {
        assertRequiredEnv()
        await connectDB()

        app.listen(Port, () => {
            console.log(`Server started at Port ${Port}`)
        })
    }
    catch (error) {
        console.error("Server Failed", error.message)
        process.exit(1)
    }
}

startServer()
