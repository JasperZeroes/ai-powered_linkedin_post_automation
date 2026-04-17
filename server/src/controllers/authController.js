const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const {
  readGoogleAuthConfig,
  exchangeGoogleAuthCode,
  verifyGoogleIdToken,
} = require("../config/googleAuthConfig");
const {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/auth.validator");
const { sendVerificationOtpEmail } = require("../services/emailService");

// Updated repository imports based on the new schema needs
const {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  initUserPreferences,
  createEmailVerificationOtp,
  findLatestActiveEmailOtpByUserId,
  incrementEmailOtpAttempts,
  consumeEmailOtp,
  markUserEmailVerified,
  savePasswordResetCode,
  findUserByEmailAndResetCode,
  updateUserPassword,
  clearPasswordResetCode,
} = require("../services/userRepository");
const { sendPasswordResetCodeEmail } = require("../services/emailService");
const { logSignupEvent, logLoginEvent } = require("../services/eventService");

// ---------------
// Helpers: Signup
// ---------------
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

// Helper to create a session and tokens
async function createSessionAndTokens(user, req) {
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

  return {
    token: signToken(user),
    refreshToken,
    session,
  };
}

// -------------------------------
// Helpers: Email OTP Verification
// -------------------------------
function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

const RESEND_GENERIC_MESSAGE =
  "If an account exists and is eligible, a verification code has been sent.";
const OTP_RESEND_COOLDOWN_MS = (env.otpResendCooldownSeconds || 30) * 1000;
const RESEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_RESEND_ATTEMPTS_PER_WINDOW = 5;
const resendAttemptStore = new Map();

function getRequestIp(req) {
  return req.ip || req.connection.remoteAddress || "unknown";
}

function isResendRateLimited(email, ipAddress) {
  const now = Date.now();
  const key = `${email}|${ipAddress}`;
  const attempts = resendAttemptStore.get(key) || [];
  const activeAttempts = attempts.filter((timestamp) => now - timestamp < RESEND_WINDOW_MS);

  if (activeAttempts.length >= MAX_RESEND_ATTEMPTS_PER_WINDOW) {
    resendAttemptStore.set(key, activeAttempts);
    return true;
  }

  activeAttempts.push(now);
  resendAttemptStore.set(key, activeAttempts);
  return false;
}

// ------------------------------
// Helpers: Forgot/Reset Password
// ------------------------------
function generatePasswordResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); //
}

// ------
// Signup
// ------
async function signup(req, res, next) {
  try {
    const { full_name, email, password, confirm_password } = req.body;

    const { isValid, errors } = validateSignup({ full_name, email, password, confirm_password });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      if (existing.auth_provider === "google") {
        return res.status(409).json({
          success: false,
          message: "This email is registered with Google. Use Google sign-in.",
        });
      }

      if (existing.email_verified) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }

      return res.status(409).json({
        success: false,
        message: "Email already registered but not verified. Request a new OTP.",
      });
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

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await createEmailVerificationOtp({
      userId: user.id,
      otpHash,
      expiresAt: otpExpiresAt,
    });

    await sendVerificationOtpEmail({
      toEmail: user.email,
      fullName: user.full_name,
      otpCode,
    });

    // 3. Log usage event via centralized event service
    try {
      await logSignupEvent({
        userId: user.id,
        provider: "local",
      });
    } catch (err) {
      console.error("Failed to log signup event:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Please verify the OTP sent to your email.",
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          email_verified: user.email_verified,
        },
        email_verification_required: true,
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

    if (user.account_status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended" });
    }

    if (!user.email_verified || user.account_status === "pending_verification") {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Verify your OTP before logging in.",
      });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // REMOVED: updateLastLoginAt(user.id) - this is now handled by usage_events

    const { token, refreshToken, session } = await createSessionAndTokens(user, req);

    // 3. Log usage event via centralized event service
    try {
      await logLoginEvent({
        userId: user.id,
        sessionId: session.id,
        provider: "local",
      });
    } catch (err) {
      console.error("Failed to log login event:", err);
    }

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
// Email OTP Verification
// ----------------------
async function verifyEmailOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const { isValid, errors } = validateVerifyOtp({ email, otp });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.account_status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended" });
    }

    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            email_verified: true,
          },
        },
      });
    }

    const otpRecord = await findLatestActiveEmailOtpByUserId(user.id);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or already used. Request a new OTP.",
      });
    }

    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new OTP.",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Request a new OTP.",
      });
    }

    const otpValid = await bcrypt.compare(otp.trim(), otpRecord.otp_hash);
    if (!otpValid) {
      await incrementEmailOtpAttempts(otpRecord.id);
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await consumeEmailOtp(otpRecord.id);
    const verifiedUser = await markUserEmailVerified(user.id);
    const { token, refreshToken, session } = await createSessionAndTokens(verifiedUser, req);

    try {
      await logLoginEvent({
        userId: verifiedUser.id,
        sessionId: session.id,
        provider: "local_otp",
      });
    } catch (err) {
      console.error("Failed to log login event after OTP verification:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        token,
        refreshToken,
        user: {
          id: verifiedUser.id,
          full_name: verifiedUser.full_name,
          email: verifiedUser.email,
          email_verified: verifiedUser.email_verified,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function resendVerificationOtp(req, res, next) {
  try {
    const { email } = req.body;

    const { isValid, errors } = validateResendOtp({ email });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getRequestIp(req);

    if (isResendRateLimited(normalizedEmail, ipAddress)) {
      return res.status(200).json({
        success: true,
        message: RESEND_GENERIC_MESSAGE,
      });
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: RESEND_GENERIC_MESSAGE,
      });
    }

    if (user.account_status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended" });
    }

    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: RESEND_GENERIC_MESSAGE,
      });
    }

    const latestOtp = await findLatestActiveEmailOtpByUserId(user.id);
    if (latestOtp) {
      const issuedAt = new Date(latestOtp.created_at).getTime();
      if (Date.now() - issuedAt < OTP_RESEND_COOLDOWN_MS) {
        return res.status(200).json({
          success: true,
          message: RESEND_GENERIC_MESSAGE,
        });
      }
    }

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);

    await createEmailVerificationOtp({
      userId: user.id,
      otpHash,
      expiresAt: otpExpiresAt,
    });

    await sendVerificationOtpEmail({
      toEmail: user.email,
      fullName: user.full_name,
      otpCode,
    });

    return res.status(200).json({
      success: true,
      message: RESEND_GENERIC_MESSAGE,
    });
  } catch (err) {
    next(err);
  }
}

// ----------------------
// Forgot/Reset Password
// ----------------------
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};

    const { isValid, errors } = validateForgotPassword({ email });
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    // Do not reveal whether the email exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset code has been sent.",
      });
    }

    const resetCode = generatePasswordResetCode();
    const resetCodeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await savePasswordResetCode({
      userId: user.id,
      resetCodeHash,
      expiresAt,
    });

    await sendPasswordResetCodeEmail({
      to: user.email,
      fullName: user.full_name,
      resetCode,
    });

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a reset code has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, reset_code: resetCode, new_password: newPassword } = req.body || {};

    const { isValid, errors } = validateResetPassword({
      email,
      reset_code: resetCode,
      new_password: newPassword,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmailAndResetCode(normalizedEmail);

    if (!user || !user.password_reset_code_hash || !user.password_reset_expires_at) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const isExpired = new Date(user.password_reset_expires_at) < new Date();
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const codeMatches = await bcrypt.compare(resetCode, user.password_reset_code_hash);
    if (!codeMatches) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code.",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await updateUserPassword({
      userId: user.id,
      passwordHash: newPasswordHash,
    });

    await clearPasswordResetCode(user.id);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
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
 * 6) the backend exchanges the "code" with Google's token endpoint (using PKCE).
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
        message:
          "Google sign-in is not configured. Add server/config/google_auth.json with your OAuth client.",
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

    const { token, refreshToken, session } = await createSessionAndTokens(user, req);

    if (isNewUser) {
      await logSignupEvent({ userId: user.id, sessionId: session.id, provider: "google" });
    } else {
      await logLoginEvent({ userId: user.id, sessionId: session.id, provider: "google" });
    }

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

// ------
// Me
// ------
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
  verifyEmailOtp,
  resendVerificationOtp,
  forgotPassword,
  resetPassword,
  googleSignupLogin,
  me,
};
