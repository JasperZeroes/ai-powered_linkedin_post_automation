const pool = require("../config/database");

async function insertDraft({
  userId,
  title,
  originalPrompt,
  tone,
  goal,
  draftContent,
  hashtags,
  cta,
}) {
  const query = `
    INSERT INTO drafts (
      user_id,
      title,
      original_prompt,
      tone,
      goal,
      draft_content,
      hashtags,
      cta
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING
      id,
      user_id,
      title,
      original_prompt,
      tone,
      goal,
      draft_content,
      hashtags,
      cta,
      status,
      last_opened_at,
      created_at,
      updated_at
  `;

  const values = [
    userId,
    title,
    originalPrompt,
    tone,
    goal,
    draftContent,
    JSON.stringify(hashtags || []),
    cta,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findDraftsByUserId(userId) {
  const query = `
    SELECT
      id,
      user_id,
      title,
      original_prompt,
      tone,
      goal,
      draft_content,
      hashtags,
      cta,
      status,
      last_opened_at,
      created_at,
      updated_at
    FROM drafts
    WHERE user_id = $1
      AND status <> 'deleted'
    ORDER BY updated_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function findDraftById({ userId, draftId }) {
  const query = `
    SELECT
      id,
      user_id,
      title,
      original_prompt,
      tone,
      goal,
      draft_content,
      hashtags,
      cta,
      status,
      last_opened_at,
      created_at,
      updated_at
    FROM drafts
    WHERE id = $1
      AND user_id = $2
      AND status <> 'deleted'
    LIMIT 1
  `;

  const result = await pool.query(query, [draftId, userId]);
  return result.rows[0] || null;
}

async function updateDraftById({
  userId,
  draftId,
  title,
  originalPrompt,
  tone,
  goal,
  draftContent,
  hashtags,
  cta,
}) {
  const query = `
    UPDATE drafts
    SET
      title = COALESCE($3, title),
      original_prompt = COALESCE($4, original_prompt),
      tone = COALESCE($5, tone),
      goal = COALESCE($6, goal),
      draft_content = COALESCE($7, draft_content),
      hashtags = COALESCE($8, hashtags),
      cta = COALESCE($9, cta),
      updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND status <> 'deleted'
    RETURNING
      id,
      user_id,
      title,
      original_prompt,
      tone,
      goal,
      draft_content,
      hashtags,
      cta,
      status,
      last_opened_at,
      created_at,
      updated_at
  `;

  const values = [
    draftId,
    userId,
    title ?? null,
    originalPrompt ?? null,
    tone ?? null,
    goal ?? null,
    draftContent ?? null,
    hashtags ? JSON.stringify(hashtags) : null,
    cta ?? null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function softDeleteDraftById({ userId, draftId }) {
  const query = `
    UPDATE drafts
    SET
      status = 'deleted',
      updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND status <> 'deleted'
    RETURNING id
  `;

  const result = await pool.query(query, [draftId, userId]);
  return result.rows[0] || null;
}

module.exports = {
  insertDraft,
  findDraftsByUserId,
  findDraftById,
  updateDraftById,
  softDeleteDraftById,
};
