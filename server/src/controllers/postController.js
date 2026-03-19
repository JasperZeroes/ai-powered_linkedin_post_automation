// const { generateLinkedInPost } = require("../services/aiService");
// const { insertGeneratedPost } = require("../services/postRepository");
// const validateGenerateRequest = require("../utils/validateGenerateRequest");

// async function generatePost(req, res, next) {
//   try {
//     const { prompt, tone, goal } = req.body;

//     const validationError = validateGenerateRequest({ prompt, tone, goal });
//     if (validationError) {
//       return res.status(400).json({
//         success: false,
//         message: validationError,
//       });
//     }

//     if (!req.user || !req.user.id) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const userId = req.user.id;

//     const result = await generateLinkedInPost({ prompt, tone, goal });

//     const savedPost = await insertGeneratedPost({
//       userId,
//       prompt,
//       tone,
//       goal,
//       post: result.post || "",
//       hashtags: result.hashtags || [],
//       cta: result.cta || "",
//       modelName: result.modelName || null,
//       generationStatus: result.generationStatus || "failed",
//       errorMessage: result.errorMessage || null,
//       generationTimeMs: result.generationTimeMs || null,
//     });

//     if (result.generationStatus === "failed") {
//       return res.status(500).json({
//         success: false,
//         message: result.errorMessage || "Failed to generate post",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         generated_post_id: savedPost.id,
//         post: result.post,
//         hashtags: result.hashtags,
//         cta: result.cta,
//         model_name: result.modelName,
//         provider: result.provider,
//         generation_time_ms: result.generationTimeMs,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// module.exports = {
//   generatePost,
// };

const { validateGeneratePost } = require("../validators/post.validator");
const { generatePostContent } = require("../services/postService");

async function generatePost(req, res, next) {
  try {
    const { prompt, tone, goal } = req.body;

    const validation = validateGeneratePost({ prompt, tone, goal });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const generatedPost = await generatePostContent({
      prompt: prompt.trim(),
      tone: tone.trim(),
      goal: goal.trim(),
    });

    return res.status(200).json({
      success: true,
      data: generatedPost,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generatePost,
};
