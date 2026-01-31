const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

exports.createProduct = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  const upload = cloudinary.uploader.upload_stream(
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
        const product = await Product.create({
          ...req.body,
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

  upload.end(req.file.buffer);
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
