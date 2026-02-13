const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// FULL URL: POST /auth/register
router.post("/register", authController.register);

// FULL URL: POST /auth/login
router.post("/login", authController.login);

module.exports = router;
