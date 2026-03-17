const pool = require("../config/database");

async function insertGeneratedPost({
  userId,
  prompt,
  tone,
  goal,
  post,
  hashtags,
  cta,
  modelName,
  generationStatus,
  errorMessage,
  generationTimeMs,
}) {
  const query = `
    INSERT INTO generated_posts (
      user_id,
      prompt,
      tone,
      goal,
      generated_content,
      hashtags,
      cta,
      model_name,
      generation_status,
      error_message,
      generation_time_ms
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
    )
    RETURNING id
  `;

  const values = [
    userId,
    prompt,
    tone,
    goal,
    post,
    JSON.stringify(hashtags),
    cta,
    modelName,
    generationStatus,
    errorMessage,
    generationTimeMs,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

module.exports = {
  insertGeneratedPost,
};
