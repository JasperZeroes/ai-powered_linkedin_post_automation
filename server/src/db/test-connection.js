const pool = require("../config/database");

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("Database connection successful.");
    console.log("Current DB time:", result.rows[0].current_time);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();
