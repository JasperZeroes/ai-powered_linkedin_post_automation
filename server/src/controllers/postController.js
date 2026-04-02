const { generateLinkedInPost } = require("../services/aiService");
const { insertGeneratedPost } = require("../services/postRepository");
const { createUsageEvent } = require("../services/userRepository");
const validateGenerateRequest = require("../utils/validateGenerateRequest");

async function generatePost(req, res, next) {
  try {
    const { prompt, tone, goal } = req.body;

    const validationError = validateGenerateRequest({ prompt, tone, goal });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const result = await generateLinkedInPost({ prompt, tone, goal });

    const savedPost = await insertGeneratedPost({
      userId,
      prompt,
      tone,
      goal,
      post: result.post || "",
      hashtags: result.hashtags || [],
      cta: result.cta || "",
      modelName: result.modelName || null,
      generationStatus: result.generationStatus || "failed",
      errorMessage: result.errorMessage || null,
      generationTimeMs: result.generationTimeMs || null,
    });

    if (result.generationStatus === "failed") {
      return res.status(500).json({
        success: false,
        message: result.errorMessage || "Failed to generate post",
      });
    }

    // Record usage event for post generation
    await createUsageEvent({
      userId,
      sessionId: null, // Can be added if session tracking is implemented but i think its not really relevant since the users had the session recorded earlier
      eventType: "post",
      eventName: "generate_post",
      metadata: {
        generated_post_id: savedPost.id,
        tone,
        goal,
        generation_time_ms: result.generationTimeMs,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        generated_post_id: savedPost.id,
        post: result.post,
        hashtags: result.hashtags,
        cta: result.cta,
        model_name: result.modelName,
        provider: result.provider,
        generation_time_ms: result.generationTimeMs,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generatePost,
};