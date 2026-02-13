const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const { addToCart, myCart, updateCartItem, removeCartItem } = require("../controllers/cartController");

router.post("/addcart", verifyJWT, addToCart);
router.get("/mycart", verifyJWT, authorize("customer"), myCart);
router.put("/updatecartitem", verifyJWT, authorize("customer"), updateCartItem);
router.delete("/removecartitem/:productId", verifyJWT, authorize("customer"), removeCartItem);

module.exports = router;
