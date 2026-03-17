const OpenAI = require("openai");
const { buildLinkedInPrompt } = require("./promptService");

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const OPENAI_MODEL = "gpt-4.1-mini";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function parseAiJsonResponse(rawContent) {
  if (!rawContent || typeof rawContent !== "string") {
    throw new Error("Empty AI response content");
  }

  let cleaned = rawContent.trim();

  // Handles ```json ... ``` and ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);

  const post = typeof parsed.post === "string" ? parsed.post.trim() : "";
  const cta = typeof parsed.cta === "string" ? parsed.cta.trim() : "";
  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags
        .filter((tag) => typeof tag === "string" && tag.trim())
        .map((tag) => tag.trim())
    : [];

  if (!post) {
    throw new Error("AI response is missing 'post'");
  }

  return {
    post,
    hashtags,
    cta,
  };
}

async function requestLinkedInPost({ client, model, provider, prompt, tone, goal }) {
  const finalPrompt = buildLinkedInPrompt({ prompt, tone, goal });
  const startedAt = Date.now();

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You generate high-quality LinkedIn posts and must return valid JSON only.",
      },
      {
        role: "user",
        content: finalPrompt,
      },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const rawContent = response.choices?.[0]?.message?.content?.trim() || "";
  const parsed = parseAiJsonResponse(rawContent);
  const generationTimeMs = Date.now() - startedAt;

  return {
    ...parsed,
    provider,
    modelName: model,
    generationStatus: "success",
    errorMessage: null,
    generationTimeMs,
  };
}

async function generateWithGroq({ prompt, tone, goal }) {
  return requestLinkedInPost({
    client: groqClient,
    model: GROQ_MODEL,
    provider: "groq",
    prompt,
    tone,
    goal,
  });
}

async function generateWithOpenAI({ prompt, tone, goal }) {
  return requestLinkedInPost({
    client: openaiClient,
    model: OPENAI_MODEL,
    provider: "openai",
    prompt,
    tone,
    goal,
  });
}

async function generateLinkedInPost({ prompt, tone, goal }) {
  try {
    return await generateWithGroq({ prompt, tone, goal });
  } catch (groqError) {
    console.error("Groq failed, falling back to OpenAI:", groqError.message);

    try {
      return await generateWithOpenAI({ prompt, tone, goal });
    } catch (openaiError) {
      console.error("OpenAI fallback also failed:", openaiError.message);

      return {
        post: "",
        hashtags: [],
        cta: "",
        provider: null,
        modelName: null,
        generationStatus: "failed",
        errorMessage: `Groq failed: ${groqError.message}. OpenAI failed: ${openaiError.message}`,
        generationTimeMs: null,
      };
    }
  }
}

module.exports = {
  generateLinkedInPost,
  generateWithGroq,
  generateWithOpenAI,
};
