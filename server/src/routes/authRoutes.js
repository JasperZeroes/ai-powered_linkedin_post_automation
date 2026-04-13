const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyEmailOtp,
  resendVerificationOtp,
  googleSignupLogin,
  me,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleSignupLogin);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/resend-email-otp", resendVerificationOtp);
router.get("/me", authMiddleware, me);

module.exports = router;
