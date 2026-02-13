// api/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("../src/config/db");

const authRoutes = require("../src/routes/authRoutes");
const resiRoutes = require("../src/routes/resiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// connect db
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/resi", resiRoutes);

// test
app.get("/", (req, res) => {
  res.send("Return Ukhti Khadijah API running (Vercel)");
});

module.exports = app;
