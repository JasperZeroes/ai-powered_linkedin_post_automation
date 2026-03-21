const { validateUsageEvent } = require("../validators/event.validator");
const { createUsageEvent } = require("../services/eventService");

async function logEvent(req, res, next) {
  try {
    const validation = validateUsageEvent(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const event = await createUsageEvent({
      userId: req.user?.id || null,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      data: {
        message: "Event logged successfully",
        event,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logEvent,
};