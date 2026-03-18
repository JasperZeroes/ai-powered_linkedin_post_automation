const pool = require("../config/database");

async function createUser({ fullName, email, passwordHash }) {
  const query = `
    INSERT INTO users (full_name, email, password_hash, auth_provider)
    VALUES ($1, $2, $3, 'local')
    RETURNING id, full_name, email, created_at
  `;
  const values = [fullName, email, passwordHash];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, password_hash, account_status, email_verified, created_at
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

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
};