const router = require("express").Router();
const upload = require("../middleware/upload");
const { authorize } = require("../middleware/role.middleware");
const verifyJWT = require("../middleware/auth.middleware")


const {
  createProduct,
  getProducts,
  deleteProduct,
  getMyProducts,
  getProductById,
  updateProduct
} = require("../controllers/productController");

// Create Product
router.post(
  "/create",
  verifyJWT,
  authorize("admin", "seller"),
  upload.single("image"),
  createProduct
);

// Get All Products
router.get(
  "/get",
  getProducts
);

// Get Products for Current User (My Products)
router.get(
  "/my",
  verifyJWT,
  authorize("admin", "seller"),
  getMyProducts
);

// Get Single Product (for edit/view)
router.get(
  "/get/:id",
  verifyJWT,
  authorize("admin", "seller"),
  getProductById
);

// Update Product
router.put(
  "/update/:id",
  verifyJWT,
  authorize("admin", "seller"),
  upload.single("image"),
  updateProduct
);

// Delete Product
router.delete(
  "/deleteProduct/:id",
  verifyJWT,
  authorize("admin", "seller"),
  deleteProduct
);



module.exports = router;
