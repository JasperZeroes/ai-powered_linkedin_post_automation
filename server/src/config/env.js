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
};
