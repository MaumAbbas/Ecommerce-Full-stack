const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload.js");

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
    const products = await Product.find()
      .populate("category seller", "name email");

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

