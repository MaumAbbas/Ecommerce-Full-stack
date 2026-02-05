const router = require("express").Router();
const { register, login, logoutUser } = require("../controllers/authController");
const verifyJWT =require("../middleware/auth.middleware")



router.post("/register", register);
router.post("/login", login);
router.post("/logout",verifyJWT,logoutUser)



module.exports = router;
