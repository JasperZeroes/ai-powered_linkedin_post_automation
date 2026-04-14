/******************************************************
 *  OFFICIAL PRIMARY TEMPLATE (UPDATED)
 *  This template generates:
 *  - post (text)
 *  - hashtags (array)
 *  - cta (string)
 ******************************************************/

function buildLinkedInPrompt({ prompt, tone, goal }) {
  return `
You are an expert LinkedIn content writer.

Write a polished LinkedIn post based on the details below.

User idea:
${prompt}

Tone:
${tone}

Goal:
${goal}

Instructions:
- Write in a natural professional LinkedIn tone
- Start with a powerful hook
- The post MUST be detailed and well-developed (minimum 150–250 words)
- Use 4–7 short paragraphs (1–3 lines each)
- Add insights, explanations, or mini storytelling to enrich the content
- Avoid being generic — make it specific and valuable
- No emojis
- The post body must NOT include hashtags
- Clearly separate sentences into short paragraphs and include one line spaces between paragraphs
- Provide EXACTLY 3 relevant hashtags in the JSON
- Provide a strong CTA (Call to Action)
- Return valid JSON ONLY
- Do NOT add markdown code fences
- Do NOT add extra text outside the JSON

Return this exact JSON structure:
{
  "post": "Main post body here",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "Thoughtful closing line or question"
}
`;
}

/******************************************************
 *  1) REWRITE TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildRewritePrompt({ text, tone }) {
  return `
You are an expert LinkedIn content editor.
Rewrite the following text into a clean, polished LinkedIn-style post.

Original text:
${text}

Tone:
${tone}

Rules:
- Preserve meaning
- Improve clarity and flow
- No emojis
- Post body MUST NOT include hashtags
- Provide EXACTLY 3 new relevant hashtags
- Provide a new CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Rewritten post body",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "New CTA"
}
`;
}

/******************************************************
 *  2) HOOK GENERATOR TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildHookPrompt({ prompt, tone }) {
  return `
You are an expert at writing high-impact LinkedIn hooks.

Topic:
${prompt}

Tone:
${tone}

Rules:
- Create a strong hook (1–2 lines max)
- No emojis
- No hashtags inside the hook
- Also generate EXACTLY 3 relevant hashtags separately
- Include a CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Hook only, 1–2 lines",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}

/******************************************************
 *  3) SUMMARY → POST TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildSummaryPrompt({ prompt, tone }) {
  return `
Summarize the following idea and transform it into a full polished LinkedIn post.

Idea:
${prompt}

Tone:
${tone}

Rules:
- Make it scannable
- Short readable paragraphs
- No emojis
- No hashtags in the post body
- Provide EXACTLY 3 hashtags in JSON
- Provide a CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Summarized and expanded LinkedIn-style post",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}

/******************************************************
 *  4) BULLETS → POST TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildBulletToPostPrompt({ bullets, tone, goal }) {
  return `
Convert the following bullet points into a structured, flowing LinkedIn post.

Bullet points:
${bullets.map((b) => "- " + b).join("\n")}

Tone:
${tone}

Goal:
${goal}

Rules:
- Transform bullets into narrative paragraphs
- Strong opening hook
- No emojis
- No hashtags inside the post body
- Provide EXACTLY 3 relevant hashtags
- Provide CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Full post generated from bullets",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}

/******************************************************
 *  5) EXPAND SHORT TEXT TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildExpandPrompt({ text, tone }) {
  return `
Expand the following short text into a complete LinkedIn-style post.

Short text:
${text}

Tone:
${tone}

Rules:
- Add depth, storytelling, insights
- 3–6 short paragraphs
- No emojis
- No hashtags in main post body
- Provide EXACTLY 3 hashtags in JSON
- Provide a CTA
- Return JSON ONLY

JSON:
{
  "post": "Expanded full LinkedIn-style post",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}

/******************************************************
 *  6) TONE SHIFT TEMPLATE (JSON OUTPUT)
 ******************************************************/

function buildToneShiftPrompt({ text, tone }) {
  return `
Rewrite the following text into a NEW tone style:

Text:
${text}

New tone:
${tone}

Rules:
- Do NOT change the meaning
- Adjust tone ONLY
- No emojis
- No hashtags inside post body
- Provide 3 NEW hashtags
- Provide a CTA
- Return JSON ONLY

JSON:
{
  "post": "Tone-shifted LinkedIn post",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}

/******************************************************
 * EXPORT ALL PROMPTS
 ******************************************************/

module.exports = {
  buildLinkedInPrompt,
  buildRewritePrompt,
  buildHookPrompt,
  buildSummaryPrompt,
  buildBulletToPostPrompt,
  buildExpandPrompt,
  buildToneShiftPrompt,
};
