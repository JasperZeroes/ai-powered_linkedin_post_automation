const { validateLogEvent } = require("../validators/event.validator");
const { logEvent } = require("../services/eventService");

async function createEvent(req, res, next) {
  try {
    const { event_type, event_name, metadata = {}, session_id = null } = req.body;

    const validation = validateLogEvent({
      event_type,
      event_name,
      metadata,
      session_id,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const event = await logEvent({
      userId: req.user.id,
      sessionId: session_id,
      eventType: event_type,
      eventName: event_name,
      metadata,
    });

    return res.status(201).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
};
