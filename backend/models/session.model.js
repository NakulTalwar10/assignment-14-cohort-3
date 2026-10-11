import mongoose from "mongoose";

const Schema = mongoose.Schema

const sessionSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    rotatedAt: {
        type: Date,
        default: null,
    },

},
    { timestamps: true }
)

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Session = mongoose.model('Session', sessionSchema)
export default Session
