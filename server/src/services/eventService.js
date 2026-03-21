const { insertUsageEvent } = require("./eventRepository");

async function createUsageEvent({ userId, data }) {
  return insertUsageEvent({
    userId,
    eventType: data.event_type,
    eventName: data.event_name,
    metadata: data.metadata || {},
    sessionId: data.session_id || null,
  });
}

module.exports = {
  createUsageEvent,
};