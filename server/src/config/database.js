const { Pool } = require("pg");
const env = require("./env");

const isProduction = env.nodeEnv === "production";

function normalizeConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslMode = (url.searchParams.get("sslmode") || "").toLowerCase();

    if (["prefer", "require", "verify-ca"].includes(sslMode)) {
      if (!url.searchParams.has("uselibpqcompat")) {
        url.searchParams.set("uselibpqcompat", "true");
      }
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}

const pool = new Pool({
  connectionString: normalizeConnectionString(env.databaseUrl),
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

module.exports = pool;
