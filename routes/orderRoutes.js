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

// Customer places an order from their cart.
router.post("/placeorder", verifyJWT, authorize("customer"), placeOrder);
// Customer triggers demo payment for their own order.
router.post("/:orderId/pay", verifyJWT, authorize("customer"), fakePayOrder);
// Customer cancels their own order when cancellation is allowed by status.
router.post("/:orderId/cancel", verifyJWT, authorize("customer"), cancelOrder);
// Seller views paid orders that include this seller's items.
router.get("/seller/orders", verifyJWT, authorize("seller"), getSellerOrders);
// Seller marks one owned item as shipped (item-level status update).
router.patch("/seller/orders/:orderId/items/:itemId/ship", verifyJWT, authorize("seller"), markItemShipped);
// Customer fetches order history with item-level tracking info.
router.get("/customer/orders", verifyJWT, authorize("customer"), getCustomerOrders);

module.exports = router;
