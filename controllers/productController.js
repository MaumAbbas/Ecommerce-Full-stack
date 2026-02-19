const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");

exports.createProduct = async (req, res) => {

  const { title, description, price, stock, category } = req.body;
  // Change: validate required fields explicitly (avoid treating 0 as "missing").
  if (!title || !description || price === undefined || price === null || !category) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }
  if (!req.file) {  // multer gives us this bc we use single that why its giving file if we use field name it wil gives us us files
    return res.status(400).json({ message: "No image file provided" });
  }

  // Change: normalize numeric fields to avoid storing strings and catch NaN.
  const normalizedPrice = Number(price);
  const normalizedStock = stock === undefined || stock === null ? 0 : Number(stock);
  if (Number.isNaN(normalizedPrice) || Number.isNaN(normalizedStock)) {
    return res.status(400).json({ message: "Price and stock must be numbers" });
  }

  // Validate category early so invalid values don't become 500 cast errors.
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ message: "Invalid category id" });
  }

  const categoryExists = await Category.exists({ _id: category });
  if (!categoryExists) {
    return res.status(400).json({ message: "Category not found" });
  }

  // Change: guard against missing auth context to avoid crashing when req.user is undefined.
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized: missing user context" });
  }

  let uploadToCloudinary;
  try {
    // Change: wrap stream creation in try/catch in case Cloudinary throws synchronously.
    uploadToCloudinary = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          {
            width: 1200,
            height: 1200,
            crop: "fill",
            gravity: "auto",
          },
        ],
      },
      async (err, result) => {
        if (err) {
          console.error("Cloudinary upload error:", err);
          return res.status(500).json({
            message: "Image upload failed",
            error: err.message,
          });
        }

        try {
          const product = await Product.create({  //this is async process so after this upload.end(req.file.buffer); we will get the url and other things
            title,
            description,
            price: normalizedPrice,
            stock: normalizedStock,
            category,   //we will fill this later
            seller: req.user._id,
            image: {
              url: result.secure_url,
              public_id: result.public_id,
            },
          });

          return res.status(201).json(product);
        } catch (dbError) {
          console.error("Product creation error:", dbError);
          return res.status(500).json({
            message: "Product creation failed",
            error: dbError.message,
          });
        }
      }
    );
  } catch (cloudinaryError) {
    console.error("Cloudinary init error:", cloudinaryError);
    return res.status(500).json({
      message: "Image upload failed to start",
      error: cloudinaryError.message,
    });
  }

  uploadToCloudinary.end(req.file.buffer); // calling function here and passing the argument  adn we can not use awiat bc uploader.stream doesnot return promise so if we want to use await we have to wrap uploadToCloudinaty to promise just i did in productController2.txt
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate([
      { path: "category", select: "name parentCategory" },
      { path: "seller", select: "name email" }
    ]);

    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      message: "Failed to get products",
      error: error.message,
    });
  }
};

//delte product route
exports.deleteProduct = async (req, res) => {  // we will id in params from front
  try {

    //1. First we will find the product we will get the product id from front end we we hit delete product button we will also get its product id in parmad we will send id explecity by makiing function 


    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    //we will write the logic if the role is seller then he can delet the prodcuts that he made
    if (
      req.user.role === "seller"
      && req.user._id.toString() !== product.seller.toString()
    ) {
      return res.status(403).json({
        message: "You can delete only your own products"
      });
    }

    //here both seller and admin can delete the product 

    // Best-effort Cloudinary cleanup: log and continue if image deletion fails
    if (product.image && product.image.public_id) {
      try {
        await cloudinary.uploader.destroy(product.image.public_id);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    await Product.deleteOne({ _id: product._id });

    return res.status(200).json({
      message: "Product deleted successfully"
    });


  } catch (error) {
    return res.status(500).json({
      message: "Delete failed",
      error: error.message
    });
  }
}


// Get Products for Current User (Seller sees own, Admin sees all)
// --------------------------
exports.getMyProducts = async (req, res) => {
  try {
    let products;


    //1.We will check if the req user is seller then we will show the product only he needed
    if (req.user.role === "seller") {
      //we will find only those product using the seller id and we used populate in category and seller because they contain refrence and have their own name and details but ac to usage we will decide to use this in frontend or not
      products = await Product.find({ seller: req.user._id }).populate([
        { path: "category", select: "name parentCategory" },
        { path: "seller", select: "name email" }
      ]);
    } else {  //if he is not seller that means he is admin he can see all products 
      products = await Product.find().populate([
        { path: "category", select: "name parentCategory" },
        { path: "seller", select: "name email" }
      ]);
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Get my products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --------------------------
// Get Single Product for Editing when we click on edit button then we will come to this route and the user will shown the current details of product so we can edit 
// --------------------------
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate([
      { path: "category", select: "name parentCategory" },
      { path: "seller", select: "name email" }
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.user.role === "seller" && product.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Fetch product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update Product

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check: Seller can update only own product, Admin can update any
    if (req.user.role === "seller" && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own products" });
    }

    const { title, description, price, stock, category } = req.body;

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (stock !== undefined) {
      const normalizedStock = Number(stock);
      if (Number.isNaN(normalizedStock)) {
        return res.status(400).json({ message: "Stock must be a number" });
      }
      product.stock = normalizedStock;
    }
    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: "Invalid category id" });
      }
      const categoryExists = await Category.exists({ _id: category });
      if (!categoryExists) {
        return res.status(400).json({ message: "Category not found" });
      }
      product.category = category;
    }

    // Price: allow both admin and seller to update
    if (price !== undefined) {
      const normalizedPrice = Number(price);
      if (Number.isNaN(normalizedPrice)) {
        return res.status(400).json({ message: "Price must be a number" });
      }
      product.price = normalizedPrice;
    }
    // If you want to restrict admin from updating price, use this instead:
    // if (req.user.role === "seller" && price !== undefined) {
    //   product.price = Number(price);
    // }

    // Update image if provided
    if (req.file) {
      if (product.image && product.image.public_id) {
        try {
          await cloudinary.uploader.destroy(product.image.public_id);
        } catch (err) {
          console.error("Old image deletion failed:", err);
        }
      }

      const uploadToCloudinary = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "products",
            transformation: [
              { quality: "auto", fetch_format: "auto" },
              { width: 1200, height: 1200, crop: "fill", gravity: "auto" },
            ],
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);//this will be stored in uploadTocloudinary
          }
        );
        stream.end(req.file.buffer);
      });

      product.image = {
        url: uploadToCloudinary.secure_url,
        public_id: uploadToCloudinary.public_id,
      };
    }

    await product.save();

    return res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    // If no search query is provided
    if (!q || q.trim() === "") {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    // Escape regex characters to avoid unintended patterns
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search products by title or description (case-insensitive)
    const products = await Product.find(
      {
        $or: [
          { title: { $regex: escapedQuery, $options: "i" } },
          { description: { $regex: escapedQuery, $options: "i" } },
        ],
      },
      // send ONLY required fields to frontend
      "title  description price image stock"
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({
      message: "Failed to search products",
      error: error.message,
    });
  }
};
