const verifyJWT = require("../middleware/auth.middleware");
const router = require("express").Router();
const { addToCart } = require("../controllers/cartController");

router.post("/addcart", verifyJWT, addToCart);

module.exports = router;
