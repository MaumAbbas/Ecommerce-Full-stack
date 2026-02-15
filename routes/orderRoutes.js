const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const { placeOrder } = require("../controllers/orderController");

router.post("/placeorder", verifyJWT, authorize("customer"), placeOrder);

module.exports = router;
