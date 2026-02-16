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

            //we will use the seller id so we can track which item belogs to which seller and he can mark them shipped or other
            seller: {
                type: mongoose.Schema.Types.ObjectId,
                refrence: "User",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },

            //this is for each item status according to its seller 
            status: {
                type: String,
                enum: ["processing", "shipped", "delivered"],
                default: "processing"
            }
        }
    ],
    totalAmount: { // we have to find the total amount for the created order
        type: Number,
        required: true
    },
    //this is the status of order overall order status
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    paymentStatus: {
        type: string,
        enum: ["pending", "paid", "refunded", "failed"],
        default: "pending"
    },
    paymentReference: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date
    }

}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)
