function validateLogEvent(data) {
  const errors = {};

  if (!data.event_type || typeof data.event_type !== "string" || !data.event_type.trim()) {
    errors.event_type = "Event type is required";
  }

  if (!data.event_name || typeof data.event_name !== "string" || !data.event_name.trim()) {
    errors.event_name = "Event name is required";
  }

  if (data.metadata !== undefined) {
    const isObject =
      typeof data.metadata === "object" && data.metadata !== null && !Array.isArray(data.metadata);

    if (!isObject) {
      errors.metadata = "Metadata must be an object";
    }
  }

  if (data.session_id !== undefined && typeof data.session_id !== "string") {
    errors.session_id = "Session ID must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateLogEvent,
};
