const router = require("express").Router();
const { register, login, logoutUser, refreshAccessToken, changeCurrentPassword } = require("../controllers/authController");
const verifyJWT = require("../middleware/auth.middleware")



router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logoutUser)
router.post("/refresh-token", refreshAccessToken)
router.post("/change-password", verifyJWT, changeCurrentPassword)



module.exports = router;
