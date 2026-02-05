const User = require("../models/User");
const jwt = require("jsonwebtoken")

const verifyJWT = async (req, res, next) => {
    try {
        const token =
            (req.cookies && req.cookies.accessToken) ||
            (req.header("Authorization") && req.header("Authorization").replace("Bearer ", ""));


        //we will check if we get the token

        if (!token) {
           return  res.status(401).json({ message: "Unathorized access" })
        }

        //if we get the token now we will verfiy the token

        let decodedToken;
        try{
            decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        }catch(err){
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        //after decoding the token we can get the  userid bc we save the user detail inside accesstoken body while we created it in the User.model.js

        const user= await User.findById(decodedToken.id).select("-password -refreshToken"); //here we use id bc in jwt sing in we used id : this._id so actually we are using id 

        if(!user){
             return res.status(401).json({ message: "User not found" });
        }

        // Attach the found user to req
        // 5. Attach user to request object
        req.user = user;

        //we will forward to next function
        next()

    } catch (err) {
        // Unexpected errors
        res.status(500).json({ message: "Something went wrong", error: err.message });
    }
}

module.exports = verifyJWT;
