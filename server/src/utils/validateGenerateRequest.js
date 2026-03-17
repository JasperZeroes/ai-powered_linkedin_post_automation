function validateGenerateRequest({ prompt, tone, goal }) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return "Prompt is required.";
  }

  if (!tone || typeof tone !== "string") {
    return "Tone is required.";
  }

  if (!goal || typeof goal !== "string") {
    return "Goal is required.";
  }

  if (prompt.length > 2000) {
    return "Prompt is too long.";
  }

  return null;
}

module.exports = validateGenerateRequest;
