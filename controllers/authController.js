//we are going to use the user for crud operation 
const User = require("../models/User");
// we need this to generate token so we will send these token to our browser using cookies 
const generateToken = require("../utils/generateToken");


//we will make the cookie function that send the token to broweser and and it get the token as parameter from where it is called 

const sendTokenCookies = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
    })
}

// Helper to return safe user data
const getSafeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        //this will check if all the fields are required
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });

        }

        //we will check if the user alread exists 
        let existingUser = await User.findOne({ 
            $or : [{name , email }] //checks both 
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
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Find user 
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token & send cookie
        const token = generateToken(user);
        sendTokenCookies(res, token);
        res.json({
            message: "Login successful",
            user: getSafeUser(user),
        });


    } catch (err) {
        res.status(500).json({ message: err.message });

    }

}

