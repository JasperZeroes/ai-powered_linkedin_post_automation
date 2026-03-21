/*
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
- Write in a natural, professional human tone
- Keep paragraphs short and readable
- Start with a strong hook
- Make it sound natural, not robotic
- Keep it suitable for LinkedIn
- The main post must NOT include hashtags
- Provide exactly 3 relevant hashtags
- End with a thoughtful CTA
- Return valid JSON only
- Do not add markdown code fences

Return this exact structure:
{
  "post": "Main post body here",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "Thoughtful closing line or question"
}
`;
}

module.exports = {
  buildLinkedInPrompt,
};
*/

/******************************************************
 *  OFFICIAL PRIMARY TEMPLATE (UPDATED WITH WORD COUNT)
 ******************************************************/

function buildLinkedInPrompt({ prompt, tone, goal }) {
  return `
You are an expert LinkedIn content writer.

Write a polished, well‑structured LinkedIn post based on the details below.

User idea:
${prompt}

Tone:
${tone}

Goal:
${goal}

Length requirements:
- The post MUST be between 120 and 220 words.
- Expand ideas naturally to reach the desired length.
- Include context, examples, or mini‑insights if needed.

Styling rules:
- Start with a powerful hook
- Use short paragraphs (1–3 lines each)
- No emojis
- No hashtags inside the post body
- Add EXACTLY 3 relevant hashtags separately in the JSON
- Add a strong CTA (1 line)
- Return VALID JSON ONLY
- No markdown, no backticks, no text outside the JSON

Return this exact JSON structure:
{
  "post": "Full post body (120–220 words, multi-paragraph)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "Thoughtful closing question or call to action"
}
`;
}


/******************************************************
 *  REWRITE TEMPLATE (WITH WORD COUNT)
 ******************************************************/

function buildRewritePrompt({ text, tone }) {
  return `
Rewrite the following into a polished LinkedIn post:

Original text:
${text}

Tone:
${tone}

Length rules:
- Final rewritten post MUST be between 120 and 220 words.
- Expand weak areas with context or examples.

Styling rules:
- No emojis
- No hashtags inside post body
- Provide EXACTLY 3 relevant hashtags
- Provide a new CTA
- Short readable paragraphs
- Return JSON ONLY, NO text outside JSON

JSON structure:
{
  "post": "Rewritten post (120–220 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "New CTA"
}
`;
}


/******************************************************
 *  HOOK GENERATOR TEMPLATE (WITH LENGTH LOGIC)
 ******************************************************/

function buildHookPrompt({ prompt, tone }) {
  return `
Generate a powerful LinkedIn hook AND a matching full post.

Topic:
${prompt}

Tone:
${tone}

Length:
- Hook must be 1–2 lines max.
- Full post must be 120–180 words.

Styling rules:
- Strong attention‑grabbing hook
- No emojis
- No hashtags inside post body
- EXACTLY 3 hashtags in JSON
- Include a CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Hook + full post (minimum 120 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}


/******************************************************
 *  SUMMARY TEMPLATE (WITH LENGTH)
 ******************************************************/

function buildSummaryPrompt({ prompt, tone }) {
  return `
Summarize the idea AND expand it into a full LinkedIn post.

Idea:
${prompt}

Tone:
${tone}

Length:
- Final post MUST be 130–200 words.

Styling rules:
- Clear, readable paragraphs
- No emojis
- No hashtags inside main post
- EXACTLY 3 hashtags in JSON
- Include CTA
- Return JSON ONLY

JSON structure:
{
  "post": "Summarized + expanded post (130–200 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}


/******************************************************
 *  BULLETS → POST TEMPLATE (WITH LENGTH)
 ******************************************************/

function buildBulletToPostPrompt({ bullets, tone, goal }) {
  return `
Convert the following bullet points into a long, structured LinkedIn post:

Bullets:
${bullets.map(b => "- " + b).join("\n")}

Tone:
${tone}

Goal:
${goal}

Length:
- Final post must be between 140 and 220 words.

Rules:
- Transform bullets into narrative paragraphs
- Start with a strong hook
- No emojis
- No hashtags in post body
- EXACTLY 3 relevant hashtags
- CTA required
- JSON output only

JSON structure:
{
  "post": "Expanded post (140–220 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA"
}
`;
}


/******************************************************
 *  EXPAND SHORT TEXT TEMPLATE (WITH LENGTH)
 ******************************************************/

function buildExpandPrompt({ text, tone }) {
  return `
Expand the following text into a complete, long LinkedIn post:

Text:
${text}

Tone:
${tone}

Length:
- Final post must be 150–230 words.

Styling rules:
- Add insights, storytelling, examples
- Short readable paragraphs
- No emojis
- No hashtags in post body
- EXACTLY 3 hashtags
- Include CTA
- Return JSON ONLY

JSON:
{
  "post": "Expanded long post (150–230 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}


/******************************************************
 *  TONE SHIFT TEMPLATE (WITH LENGTH)
 ******************************************************/

function buildToneShiftPrompt({ text, tone }) {
  return `
Rewrite the following text with a NEW tone style:

Original:
${text}

New tone:
${tone}

Length:
- Final post must be 120–200 words.

Styling rules:
- Adjust tone but keep meaning
- No emojis
- No hashtags inside post
- EXACTLY 3 hashtags
- Add CTA
- JSON ONLY

JSON:
{
  "post": "Tone‑shifted post (120–200 words)",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "cta": "CTA line"
}
`;
}


/******************************************************
 *  EXPORT ALL
 ******************************************************/
module.exports = {
  buildLinkedInPrompt,
  buildRewritePrompt,
  buildHookPrompt,
  buildSummaryPrompt,
  buildBulletToPostPrompt,
  buildExpandPrompt,
  buildToneShiftPrompt
};
