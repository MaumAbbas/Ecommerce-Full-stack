//we are going to use the user for crud operation 
const User = require("../models/User");
const jwt = require("jsonwebtoken")

// we need this to generate token so we will send these token to our browser using cookies 
// const generateToken = require("../utils/generateToken");


//we will make the cookie function that send the token to broweser and and it get the token as parameter from where it is called 

//we are not going to do this we will use another approach
// const sendTokenCookies = (res, token) => {
//     res.cookie("token", token, {
//         httpOnly: true,
//         secure: true, // process.env.NODE_ENV === "production"
//         sameSite: "strict",
//         maxAge: 10 * 24 * 60 * 60 * 1000,
//     })
// }

// Helper to return safe user data
const getSafeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

//here we will make a function that is use to generate access and refresh token we just pass the userid and it gives us the token

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        //1.First we will find the user using his id so we generate the tokens for that user and for each differnt user we will make differnt token that why we are using the user so we need to find it first
        const user = await User.findById(userId);
        // Updated: avoid calling token methods on null when user does not exist
        if (!user) {
            throw new Error("User not found");
        }
        //2.This will generate accestoken bc we made this function using mongoose so we can direlcty use these function anywhere using the user we found
        const accessToken = user.generateAccessToken();

        const refreshToken = user.generateRefreshToken();

        // 3. Once we created refresh token we need to save it in db if dont need revalidating everything so that why we use this syntax
        //this line change the value in memory not yet change in db like changing the variable 

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        //now this will save data in database we dont need to revalidate bc already validated

        return { accessToken, refreshToken } // we are returin bc we need these two in the login

    } catch (err) {
        throw new Error("Error generating tokens: " + err.message); // because we are using respone in this function
    }
}
const isProduction = process.env.NODE_ENV === "production"; //if we dont do this when we send cookie in production they will nt sent bc of strict

const accessTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
};


exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        //this will check if all the fields are required
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });

        }

        //we will check if the user alread exists 
        let existingUser = await User.findOne({
            // Updated: $or must be separate objects so it matches either name OR email
            $or: [{ name }, { email }]
        });
        //just for now we are sending user details we want to check the postman
        if (existingUser) {
            return res.status(409).json({ message: "User already exists with this email or name" }); //we can make it bettter if we do sepreatly
        }

        // Now here we will create the user
        const user = await User.create({
            name,
            email,
            password,
            role: role || "customer",
        });

        //This will send a message if user is created succesfully
        // Updated: return to avoid any accidental fall-through after sending response
        return res.status(201).json({ message: "User created successfully", user: getSafeUser(user) });// inseted of this we can do which is more good is this 
        /**
         * const createdUser = await User.findById(user._id).select(
         *          "-password -refreshtoken"
         * )
         * 
         * if(!createdUser){
         *          res.status(201).json({createdUser})
         * }
         */



    } catch (error) {
        // Updated: return to keep response flow consistent
        return res.status(500).json({ message: error.message });

    }
}

//here we will make the login logic 
exports.login = async (req, res) => {
    try {
        const { email, name, password } = req.body
        // validation
        if (
            !password?.trim() ||
            !(email?.trim() || name?.trim())
        ) {
            return res.status(400).json({
                message: "Password and either email or name are required",
            });
        }



        // build query safely
        const query = [];
        if (email) query.push({ email });
        if (name) query.push({ name });

        // Find user 
        const user = await User.findOne({ $or: query });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // If user is validate we will generat access and and refres token for the user and we will pass the id to the function 

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        //extra step we can send logged in user info using the getsafeuser function

        // Updated: refreshToken field is camelCase, so exclude the correct field
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


        //using return to chain the cookie and response

        return res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", refreshToken, refreshTokenOptions)
            .json({
                message: "Login successful",      // A friendly message
                user: loggedInUser                // User info (without password/refreshToken)
                // Updated: do not return tokens in JSON since we already set httpOnly cookies

            })


        // Generate token & send cookie we are not using this we are going to use different method
        // const token = generateToken(user);
        // sendTokenCookies(res, token);
        // res.json({
        //     message: "Login successful",
        //     user: getSafeUser(user),

        // });



    } catch (err) {
        // Updated: return to keep response flow consistent
        return res.status(500).json({ message: err.message });

    }

}


exports.logoutUser = async (req, res) => {
    try {
        //when the user comes from after the verifyJWT we have user in our request 
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true  // this means mongoose will return the new update document bc mongoose  returns the OLD document
            }
        )

        return res
            .status(200)
            .clearCookie("accessToken", accessTokenOptions)
            .clearCookie("refreshToken", refreshTokenOptions)
            // Updated: message typo fix for consistency
            .json({ message: "User logout successfully" })
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

}
// Now here we will make the logic of refreshing acces token so when the acces token experis using the stored refresh token in our db by comparing it to the coming refresh token from user then we update the access token bc it is exp in 15 min

exports.refreshAccessToken = async (req, res) => {
    try {
        //Here the form cookies we will get the refresh token of current user bc they already have and cookie automatically send this 
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            return res
                .status(401)
                .clearCookie("accessToken", accessTokenOptions)
                .clearCookie("refreshToken", refreshTokenOptions)
                .json({ message: "Unauthorized request" })
        }

        //if we have incomingRefresgh token so we will decode it and we will get that user id who send this incomming refresh token 
        let decodedRefreshToken;
        try {
            decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_REFRESH_SECRET)
        } catch (err) {
            return res
                .status(401)
                .clearCookie("accessToken", accessTokenOptions)
                .clearCookie("refreshToken", refreshTokenOptions)
                .json({ message: "Invalid or expired token" });
        }
        // after decoding then we will find the user form the decodeToken i am usign id instead of _id bc i used id:this._id in jwt refreshtoken body
        const user = await User.findById(decodedRefreshToken.id)

        if (!user) {
            return res
                .status(401)
                .clearCookie("accessToken", accessTokenOptions)
                .clearCookie("refreshToken", refreshTokenOptions)
                .json({ message: "Invalid refresh token" })
        }

        //now we will check if the token saved in user database and incomig token is same or not

        if (incomingRefreshToken !== user.refreshToken) {
            return res
                .status(401)
                .clearCookie("accessToken", accessTokenOptions)
                .clearCookie("refreshToken", refreshTokenOptions)
                // Updated: normalize spacing in response object
                .json({ message: "Token is not valid or expired" })
        }

        //if the token are match we will generate 
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", refreshToken, refreshTokenOptions)
            .json({
                // Updated: normalize spacing in response object
                message: "Token refreshed successfully"
            })


    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

}


//Here we will make the controller for the changing the cureent passwrod

exports.changeCurrentPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword?.trim() || !newPassword?.trim()) {
            return res.status(400).json({ message: "Old and new password are required" });
        }

        //because if user is changing the password means he is already loged in so we can verify using the verify jwt by passing in the route so after verify jwt we will get the user in req.user

        const user = await User.findById(req.user?._id)

        if (!user) {
            return res.status(401).json({ message: "Unauthorized request" });
        }

        //Now we will check the enterd password by user is correnct or not means the old password 

        const isPasswordCorrect = await user.matchPassword(oldPassword)

        if (!isPasswordCorrect) {
            // Updated: use 401 for auth-related mismatch
            return res.status(401).json({ message: "Old password is incorrect" })
        }

        user.password = newPassword

        await user.save({ validateBeforeSave: false })

        return res.status(200).json({ message: "Password updated successfully" })


    } catch (err) {
        // Updated: return to keep response flow consistent
        return res.status(500).json({ message: err.message })
    }
}



