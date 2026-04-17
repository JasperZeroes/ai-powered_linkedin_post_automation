const pool = require("../config/database");

async function createUser({
  fullName,
  email,
  passwordHash,
  authProvider = "local", // can be local or google
  profileImageUrl = null,
}) {
  // if local: default to pending_verification, else google: active
  const accountStatus = authProvider === "local" ? "pending_verification" : "active";
  // if local: default to false, else google: true
  const emailVerified = authProvider === "local" ? false : true;

  const query = `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      account_status,
      email_verified,
      auth_provider,
      profile_image_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, full_name, email, account_status, email_verified, auth_provider, created_at
  `;
  const values = [
    fullName,
    email,
    passwordHash,
    accountStatus,
    emailVerified,
    authProvider,
    profileImageUrl,
  ];
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
    const existing = await pool.query("SELECT * FROM user_preferences WHERE user_id = $1", [
      userId,
    ]);
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

async function createEmailVerificationOtp({ userId, otpHash, expiresAt }) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        INSERT INTO email_verification_otps (
          user_id,
          otp_hash,
          expires_at,
          attempts,
          consumed_at,
          created_at
        )
        VALUES ($1, $2, $3, 0, NULL, NOW())
        ON CONFLICT (user_id) WHERE consumed_at IS NULL
        DO UPDATE SET
          otp_hash = EXCLUDED.otp_hash,
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
          account_status = CASE
            WHEN account_status = 'pending_verification' THEN 'active'
            ELSE account_status
          END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, account_status, email_verified, created_at
    `,
    [userId]
  );

  return result.rows[0] || null;
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
  createEmailVerificationOtp,
  findLatestActiveEmailOtpByUserId,
  incrementEmailOtpAttempts,
  consumeEmailOtp,
  markUserEmailVerified,
  savePasswordResetCode,
  findUserByEmailAndResetCode,
  updateUserPassword,
  clearPasswordResetCode,
};
