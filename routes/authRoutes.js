const router = require("express").Router();
const { register, login, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails } = require("../controllers/authController");
const verifyJWT = require("../middleware/auth.middleware")



router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logoutUser)
router.post("/refresh-token", refreshAccessToken)
router.post("/changepassword", verifyJWT, changeCurrentPassword)
router.get("/me", verifyJWT, getCurrentUser)
router.put("/accountupadate", verifyJWT, updateAccountDetails)




module.exports = router;
