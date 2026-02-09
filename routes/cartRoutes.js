const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const { addToCart , myCart } = require("../controllers/cartController");

router.post("/addcart", verifyJWT, addToCart);
router.get("/mycart",verifyJWT,authorize("customer"), myCart)

module.exports = router;
