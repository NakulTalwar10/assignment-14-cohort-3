import mongoose from "mongoose";

const schema = mongoose.Schema

const userSchema = new schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
    },
},
    {
        timestamps: true,
    }
)

const User = mongoose.model('User', userSchema)
export default User