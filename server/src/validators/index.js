const { validateSignup, validateLogin } = require("./auth.validator");
const { validateGeneratePost } = require("./post.validator");
const { validateCreateDraft, validateUpdateDraft } = require("./draft.validator");
const { validateLogEvent } = require("./event.validator");
const { validateUuid } = require("./common.validator");

module.exports = {
  validateSignup,
  validateLogin,
  validateGeneratePost,
  validateCreateDraft,
  validateUpdateDraft,
  validateLogEvent,
  validateUuid,
};
