const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTP, // For signup OTP verification
  signin,
  verifySigninOTP, // For signin OTP verification
  resendOTP,
  user,
  signout,
} = require("../controllers/signupController");

const authenticate = require("../middlewares/authenticate");

// ===== SIGNUP FLOW =====
// 1️⃣ Send OTP to new user
router.post("/send-otp", sendOTP);

// 2️⃣ Verify OTP & save user in DB + return JWT
router.post("/verify-signup", verifyOTP);

// // ===== SIGNIN FLOW =====
// 3️⃣ Send OTP to existing user
router.post("/signin", signin);

// // 4️⃣ Verify OTP & return JWT for authenticated session
router.post("/verify-signin", verifySigninOTP);

// // resend-otp route
router.post("/resend-otp", resendOTP);

// // user route
router.get("/user", authenticate, user);

// // ===== SIGNOUT FLOW =====
router.post("/signout", authenticate, signout);

module.exports = router;
