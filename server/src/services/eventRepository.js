const pool = require("../config/database");

async function insertUsageEvent({
  userId,
  eventType,
  eventName,
  metadata,
  sessionId,
}) {
  const query = `
    INSERT INTO usage_events (
      user_id,
      event_type,
      event_name,
      metadata,
      session_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      user_id,
      event_type,
      event_name,
      metadata,
      session_id,
      created_at
  `;

  const values = [
    userId,
    eventType,
    eventName,
    JSON.stringify(metadata || {}),
    sessionId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  insertUsageEvent,
};