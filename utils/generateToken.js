const jwt = require("jsonwebtoken");

const generateToken = (user)=>{
    return jwt.sign(
        {id:user._id , role :user.role},
        process.env.JWT_SECRET,
        { expiresIn: "10d" }
    )
}
module.exports = generateToken;

/**
 * we are making a function and export it name is genrateToken
 */