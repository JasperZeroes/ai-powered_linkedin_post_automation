require("dotenv").config();

const requiredEnvVars = ["PORT", "DATABASE_URL", "JWT_SECRET_KEY"];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET_KEY,
  nodeEnv: process.env.NODE_ENV || "development",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 10,
  otpResendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30,
  passwordResetExpiryMinutes: Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES) || 15,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  emailFrom: process.env.EMAIL_FROM,
  smtpSecure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
};
