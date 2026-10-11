import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: 2,
        maxlength: 120,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        minlength: 10,
        maxlength: 2000,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
    },
    stock: {
        type: Number,
        required: [true, "Stock is required"],
        min: [0, "Stock cannot be negative"],
        validate: {
            validator: Number.isInteger,
            message: "Stock must be a whole number",
        },
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true,
        minlength: 2,
        maxlength: 60,
        index: true,
    },
},
    {
        timestamps: true,
        versionKey: false,
    }
)

const Product = mongoose.model('Product', productSchema)
export default Product
