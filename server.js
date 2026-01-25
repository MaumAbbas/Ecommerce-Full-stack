

require("dotenv").config(); // Load environment variables

const express = require("express");

const cors = require("cors");
//this is for the cookies that we used in authControlles

const cookieParser = require("cookie-parser");
const connectDB = require("./config/db"); // MongoDB connection
const User = require("./models/user");
//In future this will be in another folder
const generateToken=require("./utils/generateToken")

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
connectDB();
app.get("/",(req,res)=>{
    res.send("hi ")
})


app.post("/add", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role });
    await user.save();

    //i will remove this later
    const token = generateToken(user);
    console.log(token)

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
