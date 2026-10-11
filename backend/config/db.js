import mongoose from "mongoose";

let pendingConnection = null

// Reuses the open connection so warm serverless invocations don't reconnect on every request.
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return
    }

    pendingConnection ??= mongoose
        .connect(process.env.MONGO_URI, { dbName: process.env.dbName })
        .then((connection) => {
            console.log(`MongoDB Connected: ${connection.connection.host}`)
        })
        .finally(() => {
            pendingConnection = null
        })

    await pendingConnection
}

export default connectDB
