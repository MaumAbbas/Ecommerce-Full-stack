

require("dotenv").config(); // Load environment variables

const express = require("express");

const cors = require("cors");
//this is for the cookies that we used in authControlles

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db"); // MongoDB connection
const seedDefaultUsers = require("./utils/seedDefaultUsers");
const seedDefaultCategories = require("./utils/seedDefaultCategories");

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

//importing routes
const authRoutes = require("./routes/authRoutes");
const productRoutes =require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

// Route declarations
app.use("/api/auth", authRoutes);
app.use("/api/product",productRoutes)
app.use("/api/cart",cartRoutes)
app.use("/api/order", orderRoutes)
app.use("/api/category", categoryRoutes)


const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultUsers();
    await seedDefaultCategories();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
