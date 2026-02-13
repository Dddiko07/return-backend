// index.js (ReturnUkhti_Backend)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const resiRoutes = require("./src/routes/resiRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// connect database
connectDB();

// prefix API
app.use("/api/auth", authRoutes);
app.use("/api/resi", resiRoutes);

// test endpoint
app.get("/", (req, res) => {
  res.send("Return Ukhti Khadijah API running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
