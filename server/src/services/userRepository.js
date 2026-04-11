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
    SELECT id, full_name, email, password_hash, auth_provider, account_status, email_verified, created_at,
           password_reset_code_hash, password_reset_expires_at
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
           account_status, email_verified, created_at, updated_at
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

async function initUserPreferences(userId) {
  const query = `
    INSERT INTO user_preferences (user_id)
    VALUES ($1)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    const existing = await pool.query("SELECT * FROM user_preferences WHERE user_id = $1", [userId]);
    return existing.rows[0];
  }

  return result.rows[0];
}

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

async function savePasswordResetCode({ userId, resetCodeHash, expiresAt }) {
  const query = `
    UPDATE users
    SET password_reset_code_hash = $2,
        password_reset_expires_at = $3
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [userId, resetCodeHash, expiresAt]);
  return result.rows[0] || null;
}

async function findUserByEmailAndResetCode(email) {
  const query = `
    SELECT id, full_name, email, password_reset_code_hash, password_reset_expires_at
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

async function updateUserPassword({ userId, passwordHash }) {
  const query = `
    UPDATE users
    SET password_hash = $2
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [userId, passwordHash]);
  return result.rows[0] || null;
}

async function clearPasswordResetCode(userId) {
  const query = `
    UPDATE users
    SET password_reset_code_hash = NULL,
        password_reset_expires_at = NULL
    WHERE id = $1
    RETURNING id
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
  initUserPreferences,
  createSession,
  savePasswordResetCode,
  findUserByEmailAndResetCode,
  updateUserPassword,
  clearPasswordResetCode,
};