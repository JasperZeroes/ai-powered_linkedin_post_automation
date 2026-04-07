const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Added for generating secure refresh tokens
const env = require("../config/env");
const {
  readGoogleAuthConfig,
  verifyGoogleAccessTokenAudience,
} = require("../config/googleAuthConfig");
const { validateSignup, validateLogin } = require("../validators/auth.validator");

// Updated repository imports based on the new schema needs
const {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  initUserPreferences,
} = require("../services/userRepository");
const { logSignupEvent, logLoginEvent } = require("../services/eventService");

// Helper to generate JWT access token
function signToken(user) {
  return jwt.sign(
    { id: user.id, full_name: user.full_name, email: user.email },
    env.jwtSecret,
    { expiresIn: "15m" } // Access tokens should be short-lived since you now have sessions/refresh tokens
  );
}

// Helper to generate a random Refresh Token
function generateRefreshToken() {
  return crypto.randomBytes(40).toString("hex");
}

// ======
// Signup
// ======
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

    // 4. Log usage event via centralized event service
    try{
      await logSignupEvent({
        userId: user.id,
        sessionId: session.id,
        metadata: {
          provider: "local",
        }
      });
    } catch (err) {
      next(err);
    }    

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created. Please log in.",
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

// =====
// Login
// =====
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

    if (user.auth_provider === "google") {
      return res.status(409).json({
        success: false,
        message: "This account uses Google sign-in.",
      });
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

    // 3. Log usage event via centralized event service
    try {
      await logLoginEvent({
        userId: user.id,
        sessionId: session.id,
        provider: "local",
      });
    } catch (err) {
      next(err);
    }

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

// Helper to fetch User Profile from Google API
async function fetchGoogleUserProfile(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

// ======================
// Google: Signup / Login
// ======================
/* FLOW:
 * 1) extension/manifest.json stores the "client id" (from Google Cloud OAuth client).
 * 2) user signs in with Google; Chrome uses that "client id" (e.g. chrome.identity) to obtain tokens from Google.
 * 3) Google returns an "access_token" to the extension.
 * 4) the extension POSTs that "access_token" to the backend API.
 * 5) the backend requests Google's tokeninfo for that "access_token".
 * 6) Google responds with JSON that includes `aud`, the OAuth client id that issued the token.
 * 7) the backend checks that `aud` equals the "client id" from google_auth.json.
 * 8) if they match, the Google token is valid, so, the backend completes sign-in and returns payload to the client.
 */
async function googleSignupLogin(req, res, next) {
  try {
    const googleConfig = readGoogleAuthConfig();
    if (!googleConfig) {
      return res.status(503).json({
        success: false,
        message: "Google sign-in is not configured. Add server/google_auth.json with your OAuth client.",
      });
    }

    const accessToken = req.body?.access_token;
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ success: false, message: "access_token is required" });
    }

    const audience = await verifyGoogleAccessTokenAudience(accessToken, googleConfig.clientId);
    if (!audience.ok) {
      return res.status(401).json({ success: false, message: audience.message });
    }

    const profile = await fetchGoogleUserProfile(accessToken);
    if (!profile?.email) {
      return res.status(401).json({ success: false, message: "Invalid or expired Google token" });
    }

    const normalizedEmail = String(profile.email).trim().toLowerCase();
    const fullName = (profile.name && String(profile.name).trim()) || normalizedEmail.split("@")[0];
    const picture = profile.picture ? String(profile.picture) : null;

    let user = await findUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (user) {
      if (user.auth_provider !== "google") {
        return res.status(409).json({
          success: false,
          message:
            "This email is already registered with a password. Sign in with email and password.",
        });
      }
    } else {
      isNewUser = true;
      const randomSecret = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomSecret, 12);
      user = await createUser({
        fullName,
        email: normalizedEmail,
        passwordHash,
        authProvider: "google",
        profileImageUrl: picture,
      });
      await initUserPreferences(user.id);
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "unknown";

    const session = await createSession({
      userId: user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await createUsageEvent({
      userId: user.id,
      sessionId: session.id,
      eventType: "auth",
      eventName: isNewUser ? "signup" : "login",
      metadata: { provider: "google" },
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
  googleSignupLogin,
  me,
};
