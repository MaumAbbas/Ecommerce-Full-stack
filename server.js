

require("dotenv").config(); // Load environment variables

const express = require("express");

const cors = require("cors");
//this is for the cookies that we used in authControlles

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db"); // MongoDB connection

//In future this will be in another folder
// const generateToken=require("./utils/generateToken") not using this now we update to refresha nd acces token 
 

// Initialize Express app
const app = express();

// Middleware

app.use(cors({
  origin: "http://localhost:5173", // Your React frontend
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes (add later when ready)
// app.use("/api/auth", require("./routes/authRoutes"));

// Connect to MongoDB
connectDB()
// .then(()=>{
  
// })
// .catch((err)=>{
//   console.log("Db connection fail !!!!",err)
// })

//importing routes
const authRoutes = require("./routes/authRoutes");
const productRoutes =require("./routes/productRoutes")

// Route declarations
app.use("/api/auth", authRoutes);
app.use("/api/product",productRoutes)


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
