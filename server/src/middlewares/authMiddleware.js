const jwt = require("jsonwebtoken");
const env = require("../config/env");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "missing or invalid authorization header",
    });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (!payload || !payload.id) {
      return res.status(401).json({
        success: false,
        message: "invalid token payload",
      });
    }

    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
