const { insertUsageEvent } = require("./eventRepository");

async function logEvent({ userId, sessionId = null, eventType, eventName, metadata = {} }) {
  return insertUsageEvent({
    userId,
    sessionId,
    eventType,
    eventName,
    metadata,
  });
}

async function logSignupEvent({ userId, sessionId = null, provider = "local" }) {
  return logEvent({
    userId,
    sessionId,
    eventType: "auth",
    eventName: "signup",
    metadata: { provider },
  });
}

async function logLoginEvent({ userId, sessionId = null, provider = "local" }) {
  return logEvent({
    userId,
    sessionId,
    eventType: "auth",
    eventName: "login",
    metadata: { provider },
  });
}

async function logPostGeneratedEvent({
  userId,
  sessionId = null,
  generatedPostId,
  modelName,
  modelProvider,
  generationTimeMs,
}) {
  return logEvent({
    userId,
    sessionId,
    eventType: "post",
    eventName: "post_generated",
    metadata: {
      generated_post_id: generatedPostId,
      model_name: modelName,
      provider: modelProvider,
      generation_time_ms: generationTimeMs,
    },
  });
}

async function logDraftSavedEvent({
  userId,
  sessionId = null,
  draftId,
  modelName = null,
  modelProvider = null,
}) {
  return logEvent({
    userId,
    sessionId,
    eventType: "draft",
    eventName: "draft_saved",
    metadata: {
      draft_id: draftId,
      model_name: modelName,
      provider: modelProvider,
    },
  });
}

module.exports = {
  logEvent,
  logSignupEvent,
  logLoginEvent,
  logPostGeneratedEvent,
  logDraftSavedEvent,
};
