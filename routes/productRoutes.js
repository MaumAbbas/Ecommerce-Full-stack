const router = require("express").Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");
const { createProduct, getProducts } = require("../controllers/productController");

router.post("/", protect, upload.single("image"), createProduct);
router.get("/", getProducts);

module.exports = router;
