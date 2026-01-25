//we are going to use the user for crud operation 
const User = require("./models/User");
// we need this to generate token so we will send these token to our browser using cookies 
const generateToken = require("./utils/generateToken");


//we will make the cookie function that send the token to broweser and and it get the token as parameter from where it is called 

const sendTokenCookies=(res,token)=>{
    res.cookies("token" ,token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
    })
}
