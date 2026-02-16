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
