const pool = require("../config/database");

async function createUser({
  fullName,
  email,
  passwordHash,
  authProvider = "local",
  profileImageUrl = null,
}) {
  const query = `
    INSERT INTO users (full_name, email, password_hash, auth_provider, profile_image_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, full_name, email, auth_provider, created_at
  `;
  const values = [fullName, email, passwordHash, authProvider, profileImageUrl];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, password_hash, auth_provider, account_status, email_verified, created_at
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

async function findUserById(id) {
  const query = `
    SELECT id, full_name, email, profile_image_url, job_title, industry, linkedin_profile_url,
           account_status, email_verified, last_login_at, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function updateLastLoginAt(id) {
  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [id]);
}

// Initialize user preferences for a new user
async function initUserPreferences(userId) {
  const query = `
    INSERT INTO user_preferences (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId]);
  // If already exists, fetch existing
  if (result.rows.length === 0) {
    const existing = await pool.query("SELECT * FROM user_preferences WHERE user_id = $1", [userId]);
    return existing.rows[0];
  }
  return result.rows[0];
}

// Create a new session for a user
async function createSession({ userId, refreshTokenHash, ipAddress, userAgent, expiresAt }) {
  const query = `
    INSERT INTO sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, is_active, expires_at, created_at;
  `;
  const values = [userId, refreshTokenHash, ipAddress, userAgent, expiresAt];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
  initUserPreferences,
  createSession,
};
