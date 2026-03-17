const ALLOWED_DRAFT_STATUSES = ["draft", "archived", "deleted"];

function validateHashtags(hashtags) {
  if (hashtags === undefined) return null;

  if (!Array.isArray(hashtags)) {
    return "Hashtags must be an array";
  }

  for (const tag of hashtags) {
    if (typeof tag !== "string" || !tag.trim()) {
      return "Each hashtag must be a non-empty string";
    }
  }

  return null;
}

function validateCreateDraft(data) {
  const errors = {};

  if (data.title !== undefined && typeof data.title !== "string") {
    errors.title = "Title must be a string";
  }

  if (
    !data.original_prompt ||
    typeof data.original_prompt !== "string" ||
    !data.original_prompt.trim()
  ) {
    errors.original_prompt = "Original prompt is required";
  }

  if (!data.tone || typeof data.tone !== "string" || !data.tone.trim()) {
    errors.tone = "Tone is required";
  }

  if (!data.goal || typeof data.goal !== "string" || !data.goal.trim()) {
    errors.goal = "Goal is required";
  }

  if (!data.draft_content || typeof data.draft_content !== "string" || !data.draft_content.trim()) {
    errors.draft_content = "Draft content is required";
  }

  if (data.status !== undefined && !ALLOWED_DRAFT_STATUSES.includes(data.status)) {
    errors.status = "Invalid draft status";
  }

  const hashtagError = validateHashtags(data.hashtags);
  if (hashtagError) {
    errors.hashtags = hashtagError;
  }

  if (data.cta !== undefined && typeof data.cta !== "string") {
    errors.cta = "CTA must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function validateUpdateDraft(data) {
  const errors = {};

  if (data.title !== undefined && typeof data.title !== "string") {
    errors.title = "Title must be a string";
  }

  if (data.original_prompt !== undefined && typeof data.original_prompt !== "string") {
    errors.original_prompt = "Original prompt must be a string";
  }

  if (data.tone !== undefined && (typeof data.tone !== "string" || !data.tone.trim())) {
    errors.tone = "Tone must be a non-empty string";
  }

  if (data.goal !== undefined && (typeof data.goal !== "string" || !data.goal.trim())) {
    errors.goal = "Goal must be a non-empty string";
  }

  if (
    data.draft_content !== undefined &&
    (typeof data.draft_content !== "string" || !data.draft_content.trim())
  ) {
    errors.draft_content = "Draft content must be a non-empty string";
  }

  if (data.status !== undefined && !ALLOWED_DRAFT_STATUSES.includes(data.status)) {
    errors.status = "Invalid draft status";
  }

  const hashtagError = validateHashtags(data.hashtags);
  if (hashtagError) {
    errors.hashtags = hashtagError;
  }

  if (data.cta !== undefined && typeof data.cta !== "string") {
    errors.cta = "CTA must be a string";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateCreateDraft,
  validateUpdateDraft,
};
