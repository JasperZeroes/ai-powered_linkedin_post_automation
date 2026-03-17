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
