const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const { placeOrder, fakePayOrder, cancelOrder } = require("../controllers/orderController");

router.post("/placeorder", verifyJWT, authorize("customer"), placeOrder);
router.post("/:orderId/pay", verifyJWT, authorize("customer"), fakePayOrder);
router.post("/:orderId/cancel", verifyJWT, authorize("customer"), cancelOrder);

module.exports = router;
