//we are going to use the user for crud operation 
const User = require("../models/User");
const mongoose = require("mongoose")
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
        res.status(201).json({ message: "User created successfully", user: getSafeUser(user) });// inseted of this we can do which is more good is this 
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
        res.status(500).json({ message: error.message });

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

        const accessTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true in production, false in dev,
            // Updated: sameSite helps reduce CSRF risk when using cookies
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        }

        const refreshTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true in production, false in dev,
            // Updated: sameSite helps reduce CSRF risk when using cookies
            sameSite: "strict",
            maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days
        }
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
        res.status(500).json({ message: err.message });

    }

}

