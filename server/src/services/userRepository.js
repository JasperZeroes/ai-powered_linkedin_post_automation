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

async function createEmailVerificationOtp({ userId, otpHash, expiresAt }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO email_verification_otps (user_id, otp_hash, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id) WHERE consumed_at IS NULL
        DO UPDATE
        SET otp_hash = EXCLUDED.otp_hash,
            expires_at = EXCLUDED.expires_at,
            attempts = 0,
            consumed_at = NULL,
            created_at = NOW()
        RETURNING id, user_id, attempts, expires_at, created_at
      `,
      [userId, otpHash, expiresAt]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function findLatestActiveEmailOtpByUserId(userId) {
  const result = await pool.query(
    `
      SELECT id, user_id, otp_hash, attempts, expires_at, consumed_at, created_at
      FROM email_verification_otps
      WHERE user_id = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findLatestEmailOtpByUserId(userId) {
  const result = await pool.query(
    `
      SELECT id, user_id, otp_hash, attempts, expires_at, consumed_at, created_at
      FROM email_verification_otps
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function incrementEmailOtpAttempts(otpId) {
  await pool.query(
    `
      UPDATE email_verification_otps
      SET attempts = attempts + 1
      WHERE id = $1
    `,
    [otpId]
  );
}

async function consumeEmailOtp(otpId) {
  await pool.query(
    `
      UPDATE email_verification_otps
      SET consumed_at = NOW()
      WHERE id = $1
    `,
    [otpId]
  );
}

async function markUserEmailVerified(userId) {
  const result = await pool.query(
    `
      UPDATE users
      SET email_verified = TRUE,
          account_status = 'active',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, account_status, email_verified, created_at
    `,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
  initUserPreferences,
  createSession,
  createEmailVerificationOtp,
  findLatestActiveEmailOtpByUserId,
  findLatestEmailOtpByUserId,
  incrementEmailOtpAttempts,
  consumeEmailOtp,
  markUserEmailVerified,
};
