const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const router = require("express").Router();
const {
  placeOrder,
  fakePayOrder,
  cancelOrder,
  getSellerOrders,
  markItemShipped,
  getCustomerOrders,
  getAdminOrders,
  clearCustomerOrder,
  clearAllCustomerOrders,
  clearSellerOrder,
  clearAllSellerOrders,
  clearAdminOrder,
  clearAllAdminOrders
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
// Customer clears a single order row from dashboard history.
router.delete("/customer/orders/:orderId", verifyJWT, authorize("customer"), clearCustomerOrder);
// Customer clears all order rows from dashboard history.
router.delete("/customer/orders", verifyJWT, authorize("customer"), clearAllCustomerOrders);
// Admin fetches all customer orders and seller item details.
router.get("/admin/orders", verifyJWT, authorize("admin"), getAdminOrders);
// Seller clears a single seller-visible order row.
router.delete("/seller/orders/:orderId", verifyJWT, authorize("seller"), clearSellerOrder);
// Seller clears all seller-visible order rows.
router.delete("/seller/orders", verifyJWT, authorize("seller"), clearAllSellerOrders);
// Admin clears a single order row from admin dashboard.
router.delete("/admin/orders/:orderId", verifyJWT, authorize("admin"), clearAdminOrder);
// Admin clears all orders from admin dashboard view.
router.delete("/admin/orders", verifyJWT, authorize("admin"), clearAllAdminOrders);

module.exports = router;
