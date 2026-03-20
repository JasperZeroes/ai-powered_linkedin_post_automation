const { generateLinkedInPost } = require("./aiService");

async function generatePostContent({ prompt, tone, goal }) {
  const result = await generateLinkedInPost({ prompt, tone, goal });

  if (result.generationStatus === "failed") {
    const error = new Error(result.errorMessage || "Failed to generate post");
    error.statusCode = 500;
    throw error;
  }

  return {
    post: result.post,
    hashtags: result.hashtags,
    cta: result.cta,
    model_name: result.modelName,
    provider: result.provider,
    generation_time_ms: result.generationTimeMs,
  };
}

module.exports = {
  generatePostContent,
};
