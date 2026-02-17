const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const {
  placeOrder,
  fakePayOrder,
  cancelOrder,
  getSellerOrders,
  markItemShipped,
  getCustomerOrders
} = require("../controllers/orderController");

router.post("/placeorder", verifyJWT, authorize("customer"), placeOrder);
router.post("/:orderId/pay", verifyJWT, authorize("customer"), fakePayOrder);
router.post("/:orderId/cancel", verifyJWT, authorize("customer"), cancelOrder);
router.get("/seller/orders", verifyJWT, authorize("seller"), getSellerOrders);
router.patch("/seller/orders/:orderId/items/:itemId/ship", verifyJWT, authorize("seller"), markItemShipped);
router.get("/customer/orders", verifyJWT, authorize("customer"), getCustomerOrders);

module.exports = router;
