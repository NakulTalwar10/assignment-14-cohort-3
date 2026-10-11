import mongoose from "mongoose";

const loginAttemptSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    hits: {
        type: Number,
        default: 0,
    },
    resetAt: {
        type: Date,
        required: true,
    },
},
    { versionKey: false }
)

loginAttemptSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema)
export default LoginAttempt
