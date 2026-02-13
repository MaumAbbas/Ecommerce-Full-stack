const Cart = require("../models/Cart.js");
const Product = require("../models/Product");
const mongoose = require("mongoose");

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

//now we will make a route where we will handle the logic where when the user open his cart he can also increse or decrese the quantity of the product and directly update 

exports.updateCartItem = async (req, res) => {
  try {
    // Changed: add defensive auth guard to avoid 500 if req.user is missing.
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const { productId, quantity } = req.body;
    // Changed: normalize to number so "2" is accepted consistently like addToCart.
    const normalizedQty = Number(quantity);

    // Changed: validate ObjectId format first, prevents CastError -> 500.
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid productId"
      });
    }

    // Changed: strict numeric validation after normalization.
    if (
      Number.isNaN(normalizedQty) ||
      !Number.isInteger(normalizedQty) ||
      normalizedQty < 1
    ) {
      return res.status(400).json({
        message: "Invalid quantity. Quantity must be an integer and at least 1"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    if (normalizedQty > product.stock) {
      return res.status(400).json({
        message: "Not enough stock available"
      });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      {
        user: userId,
        "items.product": productId
      },
      {
        $set: { "items.$.quantity": normalizedQty }
      },
      { new: true }
    ).populate("items.product", "title price image");

    if (!updatedCart) {
      return res.status(404).json({
        message: "Cart or product not found in cart"
      });
    }

    return res.status(200).json({
      message: "Cart updated successfully",
      cart: updatedCart
    });

  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};


exports.removeCartItem = async (req, res) => {
  try {
    // Changed: add defensive auth guard to avoid 500 if req.user is missing.
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    const { productId } = req.params;

    // Changed: validate ObjectId format first, prevents CastError -> 500.
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid productId"
      });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      // Changed: include items.product so success only happens when an item is actually removed.
      { user: userId, "items.product": productId },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate("items.product", "title price image");

    if (!updatedCart) {
      return res.status(404).json({
        message: "Cart not found or product not found in cart"
      });
    }

    return res.status(200).json({
      message: "Item removed successfully",
      cart: updatedCart
    });

  } catch (error) {
    console.error("Remove cart item error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    /*
    we also can just do await Cart.deleteOne({ user: userId });

    */

    const updatedCart = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(200).json({
        message: "Cart is already empty",
        cart: { items: [] }
      });
    }

    return res.status(200).json({
      message: "Cart emptied successfully",
      cart: updatedCart
    });
  } catch (error) {
    console.error("Empty cart error:", error);
    return res.status(500).json({ message: "Cart empty operation failed" });
  }
};
