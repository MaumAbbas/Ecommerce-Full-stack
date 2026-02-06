const router = require("express").Router();
const upload = require("../middleware/upload");
const { authorize } = require("../middleware/role.middleware");
const verifyJWT = require("../middleware/auth.middleware")


const { createProduct, getProducts, deleteProduct } = require("../controllers/productController");

router.post("/create", verifyJWT, authorize("admin", "seller"), upload.single("image"), createProduct); 
router.get("/get", getProducts);
router.delete("/deleteProduct/:id", verifyJWT, authorize("admin", "seller"), deleteProduct);

module.exports = router;
