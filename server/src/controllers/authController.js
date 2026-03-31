const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Added for generating secure refresh tokens
const env = require("../config/env");
const { validateSignup, validateLogin } = require("../validators/auth.validator");

// Updated repository imports based on the new schema needs
const {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  createUsageEvent,
  initUserPreferences 
} = require("../services/userRepository");

// Helper to generate JWT access token
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    env.jwtSecret,
    { expiresIn: "15m" } // Access tokens should be short-lived since you now have sessions/refresh tokens
  );
}

// Helper to generate a random Refresh Token
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

async function signup(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    const { isValid, errors } = validateSignup({ full_name, email, password });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 1. Create the User
    const user = await createUser({
      fullName: full_name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // 2. Initialize User Preferences (New Schema)
    await initUserPreferences(user.id);

    // 3. Create Session (New Schema requirement for Refresh Tokens & IP tracking)
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "unknown";

    const session = await createSession({
      userId: user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 4. Log the Usage Event (New Schema)
    await createUsageEvent({
      userId: user.id,
      sessionId: session.id,
      eventType: "auth",
      eventName: "signup",
      metadata: { provider: "local" },
    });

    return res.status(201).json({
      success: true,
      redirect: "/login",
      message: "Signup successful, Please login..."
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const { isValid, errors } = validateLogin({ email, password });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Validate User
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // REMOVED: updateLastLoginAt(user.id) - this is now handled by usage_events

    // 2. Create Session (New Schema)
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "unknown";

    const session = await createSession({
      userId: user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 3. Log the Usage Event (New Schema)
    await createUsageEvent({
      userId: user.id,
      sessionId: session.id,
      eventType: "auth",
      eventName: "login",
      metadata: { provider: "local" },
    });

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: user.id, full_name: user.full_name, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  signup,
  login,
  me,
};