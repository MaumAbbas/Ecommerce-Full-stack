const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken")

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique :true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["admin", "seller", "customer"],
            default: "customer"
        },
         refreshToken: { //we are saving refresh token in db so with the help of this we can refresh acces token
            type: String
        }

    },{timestamps:true}
)

//we are hasing password before saving so whenever a user is created or we are updating password this will wait before save if we use creat it will automatically save  and come here and run this and hash the password 

userSchema.pre("save", async function () {

    //this function check if the password is already hash means when updating user name or email 
    //and it takes the filename as parameter not the actual password and do automatically chkecking
    if (!this.isModified("password")) return;
        //this.password = the password of this particular user document
        this.password = await bcrypt.hash(this.password, 10);
})

//matchpassword is function name we are creating to comapare the enterpassword that we will get from the login route or we will call this function inside the login route so it will also give the enterpassword as parameter to this function. it automatically convert the enterd password into hash and then compare to the store this.password hash

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

 // we can mak access token and user tokenn here so we can directly use and export 
  userSchema.methods.generateAccessToken=function(){
                return jwt.sign(
         {id:this._id , role :this.role, email: this.email , name:this.name},
         process.env.ACCESS_TOKEN_SECRET, 
         { expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
     )
  }

  
  userSchema.methods.generateRefreshToken=async function(){
                   return jwt.sign(
         {id:this._id},
         process.env.ACCESS_REFRESH_SECRET, 
         { expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
     )
  }

  module.exports = mongoose.model("User", userSchema);
 
