function validateGeneratePost(data) {
  const errors = {};

  if (!data.prompt || typeof data.prompt !== "string" || !data.prompt.trim()) {
    errors.prompt = "Prompt is required";
  } else if (data.prompt.trim().length > 2000) {
    errors.prompt = "Prompt must not exceed 2000 characters";
  }

  if (!data.tone || typeof data.tone !== "string" || !data.tone.trim()) {
    errors.tone = "Tone is required";
  }

  if (!data.goal || typeof data.goal !== "string" || !data.goal.trim()) {
    errors.goal = "Goal is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateGeneratePost,
};
