const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    //this will get the id of user who place the order and other details we can find them using the id 
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [ //in oreder there can be multiple products and they have their quantity and each prodcut have its price 
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: ture
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: { // we have to find the total amount for the created order
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    }

}, { timestamps: true })

module.exports = mongoose.model("Order",orderSchema)