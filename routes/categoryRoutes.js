const router = require("express").Router();
const verifyJWT = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { getCategories, createCategory } = require("../controllers/categoryController");

router.get("/get", getCategories);
router.post("/create", verifyJWT, authorize("admin"), createCategory);

module.exports = router;

