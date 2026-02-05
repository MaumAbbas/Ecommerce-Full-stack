const router = require("express").Router();
const { register, login, logoutUser ,refreshAccessToken } = require("../controllers/authController");
const verifyJWT =require("../middleware/auth.middleware")



router.post("/register", register);
router.post("/login", login);
router.post("/logout",verifyJWT,logoutUser)
router.post("/refresh-token",refreshAccessToken)



module.exports = router;
