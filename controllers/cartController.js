const Cart = require("../models/Cart.js");
const Product = require("../models/Product");

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const normalizedQty = Number(quantity);
        if (
            !productId ||
            Number.isNaN(normalizedQty) ||
            !Number.isInteger(normalizedQty) ||
            normalizedQty < 1
        ) {
            return res.status(400).json({ message: "Invalid id or quantity" });
        }

        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "User not found" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (normalizedQty > product.stock) {
            return res.status(400).json({ message: "Not enough stock available" });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [{ product: productId, quantity: normalizedQty }]
            });
        } else {
            const itemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (itemIndex > -1) {
                const newQty = cart.items[itemIndex].quantity + normalizedQty;
                if (newQty > product.stock) {
                    return res.status(400).json({ message: "Not enough stock available" });
                }
                cart.items[itemIndex].quantity = newQty;
            } else {
                cart.items.push({ product: productId, quantity: normalizedQty });
            }

            await cart.save();
        }

        res.status(200).json({ message: "Added to cart successfully", cart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.myCart = async (req, res) => {
    try {

        //we will get this from the  req.user which jwt gives us 
        const userId = req.user._id
        if (!userId) {
            return res.status(401).json({ message: "User not found" });
        }

        //now we will find the car using the user id 

        const myCart = await Cart.findOne({ user: userId }).populate("items.product") //Find the cart where user = this userId we arepopulating the product bc in actuat cart stores the product id refrence that why we are populating 

        //means our cart is empty
        if (!myCart) {
            return res.status(200).json({
                message: "Cart is empty",
                cart: { items: [] }
            });
        }

        //if cart exist we will send cart to the fontend 
        res.status(200).json({
            message: "Cart fetched successfully",
            cart: myCart
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });

    }
}