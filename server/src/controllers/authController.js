const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { validateSignup, validateLogin } = require("../validators/auth.validator");
const {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
} = require("../services/userRepository");
const { createUsageEvent } = require("../services/eventService");

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, full_name: user.full_name },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
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

    const user = await createUser({
      fullName: full_name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user);

    try {
      await createUsageEvent({
        userId: user.id,
        data: {
          event_type: "auth",
          event_name: "user_signup",
          metadata: {
            source: "backend",
            email: user.email,
          },
        },
      });
    } catch (err) {
      console.error("Failed to log signup event:", err.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, full_name: user.full_name, email: user.email },
      },
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

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    await updateLastLoginAt(user.id);

    const token = signToken(user);

    try {
      await createUsageEvent({
        userId: user.id,
        data: {
          event_type: "auth",
          event_name: "user_login",
          metadata: {
            source: "backend",
            email: user.email,
          },
        },
      });
    } catch (err) {
      console.error("Failed to log sign in event:", err.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        token,
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