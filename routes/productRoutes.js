const router = require("express").Router();
const upload = require("../middleware/upload");
const { authorize } = require("../middleware/role.middleware");
const verifyJWT = require("../middleware/auth.middleware")

const { createProduct, getProducts } = require("../controllers/productController");

router.post("/create", verifyJWT, authorize("admin","seller"), upload.single("image"), createProduct); 
router.get("/get", getProducts);

module.exports = router;
