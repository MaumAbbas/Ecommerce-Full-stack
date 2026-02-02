const router = require("express").Router();
const upload = require("../middleware/upload");
// const { protect } = require("../middleware/authMiddleware");
const { createProduct, getProducts } = require("../controllers/productController");

router.post("/create",upload.single("image"), createProduct); // later we will add protect before the upload
router.get("/get", getProducts);

module.exports = router;
