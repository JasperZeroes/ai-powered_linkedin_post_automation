const express = require("express");
const router = express.Router();

const { signup, login, googleSignupLogin, me } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleSignupLogin);
router.get("/me", authMiddleware, me);

module.exports = router;
