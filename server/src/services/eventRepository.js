const pool = require("../config/database");

async function insertUsageEvent({ userId, sessionId, eventType, eventName, metadata }) {
  const query = `
    INSERT INTO usage_events (user_id, session_id, event_type, event_name, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, session_id, event_type, event_name, metadata, created_at;
  `;

  const values = [userId || null, sessionId || null, eventType, eventName, metadata || {}];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  insertUsageEvent,
};
