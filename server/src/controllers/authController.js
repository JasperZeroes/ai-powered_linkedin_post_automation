const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const {
  readGoogleAuthConfig,
  exchangeGoogleAuthCode,
  verifyGoogleIdToken,
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

// ------
// Signup
// ------
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
    try {
      await logSignupEvent({
        userId: user.id,
        sessionId: session.id,
        provider: "local",
      });
    } catch (err) {
      return next(err);
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

// ------
// Login
// ------
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
      return next(err);
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

// ----------------------
// Google: Signup / Login
// ----------------------
/* FLOW (OAuth 2.0 auth code + PKCE + OpenID ID token):
 * ===================================================
 * 1) extension/manifest.json stores the "client id" (from Google Cloud OAuth).
 * 2) extension starts Google sign-in via chrome.identity.launchWebAuthFlow
 *    using PKCE (code_challenge) and scopes: openid email profile.
 * 3) user signs in with Google.
 * 4) Google redirects back to the extension with an authorization "code".
 * 5) the extension POSTs "code", "code_verifier", and "redirect_uri" to the backend API.
 * 6) the backend exchanges the "code" with Google’s token endpoint (using PKCE).
 * 7) Google returns an "id_token".
 * 8) the backend verifies the "id_token" (signature, aud, iss, exp) with google-auth-library.
 * 9) if valid, the backend extracts user info (email, name, picture).
 * 10) the backend completes sign-in and returns app-specific auth payload to the client.
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

    const { code, code_verifier: codeVerifier, redirect_uri: redirectUri } = req.body || {};
    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "code is required" });
    }
    if (!codeVerifier || typeof codeVerifier !== "string") {
      return res.status(400).json({ success: false, message: "code_verifier is required" });
    }
    if (!redirectUri || typeof redirectUri !== "string") {
      return res.status(400).json({ success: false, message: "redirect_uri is required" });
    }

    const exchanged = await exchangeGoogleAuthCode({
      code,
      codeVerifier,
      redirectUri,
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
    });
    if (!exchanged.ok) {
      return res.status(401).json({ success: false, message: exchanged.message });
    }

    const verified = await verifyGoogleIdToken(exchanged.idToken, googleConfig.clientId);
    if (!verified.ok) {
      return res.status(401).json({ success: false, message: verified.message });
    }

    const payload = verified.payload;
    if (!payload?.email) {
      return res
        .status(401)
        .json({ success: false, message: "Google ID token had no email claim" });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ success: false, message: "Google email is not verified" });
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const fullName = (payload.name && String(payload.name).trim()) || normalizedEmail.split("@")[0];
    const picture = payload.picture ? String(payload.picture) : null;

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

    if (isNewUser) {
      await logSignupEvent({ userId: user.id, sessionId: session.id, provider: "google" });
    } else {
      await logLoginEvent({ userId: user.id, sessionId: session.id, provider: "google" });
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
