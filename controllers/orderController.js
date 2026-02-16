const mongoose = require("mongoose");
const Order = require("../models/Order.js");
const Cart = require("../models/Cart.js");
const Product = require("../models/Product");

//we are going to use the mongoose transcation so either order create and stock reduce either not happen
exports.placeOrder = async (req, res) => {
    //first we store the start session 
    let session;

    try {
        session = await mongoose.startSession();

        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        //we will make this here bc we want to store the order inside this so after the transcation over we can send it in the response bc inside trnascation we can not do
        let createdOrder;


        //form here our transaction will be started 

        await session.withTransaction(async () => {

            //To create the order first we need the cart of the person who is going to make the order 

            const cart = await Cart.findOne({ user: userId })
                .populate("items.product") //doing this bc we need whole prodcut not just its id that is stored in the items
                .session(session);

            if (!cart || cart.items.length === 0) {
                throw new Error("Cart is empty");
            }

            //here we are going to store the total amount which is sum of all items price and quantity
            let total = 0;
            //we will store the items inside this array ]
            const orderItems = [];

            //In Cart there will be multiple itmes so we will run loop through itmes and get each item details

            for (const item of cart.items) {
                const product = item.product;
                if (!product) {
                    throw new Error("Product not found");
                }
                if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                    throw new Error("Invalid item quantity");
                }
                if (product.stock < item.quantity) throw new Error("Out of stock");

                //after we confrim their is prodcut inside the item we will now find the total 

                total += item.product.price * item.quantity;

                //now we will push each item inside the orderitems so we can use that array in the order creation when we store the item in the order model

                orderItems.push({
                    product: product._id,
                    seller: product.seller,
                    quantity: item.quantity,
                    price: product.price
                });
            }

            // Now we will reduce stock this is transaction so either this all will be done or not done
            for (const item of orderItems) {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.product, stock: { $gte: item.quantity } }, // fixed $get -> $gte
                    { $inc: { stock: -item.quantity } },
                    { session }
                );

                if (!updated) {
                    throw new Error("Out of stock");
                }
            }

            // Now we will create 

            const [order] = await Order.create(
                [
                    {
                        customer: userId,
                        items: orderItems,
                        totalAmount: total,
                        status: "pending" // fixed missing quotes
                    }
                ],
                { session }
            );

            // now we will clear cart
            await Cart.findOneAndDelete({ user: userId }, { session });
            createdOrder = order;

        });

        return res.status(201).json({
            message: "Order placed successfully",
            order: createdOrder
        });

    } catch (error) {
        return res.status(400).json({
            message: error.message || "Order failed"
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};


exports.fakePayOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        //we will send the orderId from front end bc we have the order in response from 
        const { orderId } = req.params;

        const order = await Order.findOne({ _id: orderId, customer: userId });

        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status === "cancelled") return res.status(400).json({ message: "Order cancelled" });
        if (order.paymentStatus === "paid") return res.status(400).json({ message: "Already paid" });

        order.paymentStatus = "paid";
        order.status = "processing";
        order.paymentReference = "DEMO-" + Date.now();
        order.paidAt = new Date();
        await order.save();

        res.json({ message: "Payment successful", order });



    } catch (error) {
        res.status(500).json({ message: "Payment failed", error: error.message });
    }
}

//Now we will make the route for cancle order

exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { orderId } = req.params;

        const session = await mongoose.startSession();
        session.startTransaction();
        const order = await Order.findOne({ _id: orderId, customer: userId }).session(session);

        if (!order) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "cancelled" || order.status === "shipped" || order.status === "delivered") {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: "Cannot cancel order" });
        }

        //first we will  mange the stock we will again include the quantity of each item in stock again in order.itmes we have multiple items so we will loop through each item and inclrease that prodcut stock using the quantity of store inside the items and we will add that quantity at stock

        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            }, { session });
        }

        order.status = "cancelled";
        if (order.paymentStatus === "paid") order.paymentStatus = "refunded";

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: "Order cancelled successfully", order });


    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Something went wrong", error: error.message });

    }
}


