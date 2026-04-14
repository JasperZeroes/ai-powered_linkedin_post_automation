const {
  insertDraft,
  findDraftsByUserId,
  findDraftById,
  updateDraftById,
  softDeleteDraftById,
} = require("./draftRepository");

async function saveDraft({ userId, data }) {
  return insertDraft({
    userId,
    title: data.title || null,
    originalPrompt: data.original_prompt,
    tone: data.tone,
    goal: data.goal,
    draftContent: data.draft_content,
    hashtags: data.hashtags || [],
    cta: data.cta || "",
  });
}

async function fetchUserDrafts(userId) {
  return findDraftsByUserId(userId);
}

async function fetchDraftById({ userId, draftId }) {
  return findDraftById({ userId, draftId });
}

async function editDraft({ userId, draftId, data }) {
  return updateDraftById({
    userId,
    draftId,
    title: data.title,
    originalPrompt: data.original_prompt,
    tone: data.tone,
    goal: data.goal,
    draftContent: data.draft_content,
    hashtags: data.hashtags,
    cta: data.cta,
  });
}

async function removeDraft({ userId, draftId }) {
  return softDeleteDraftById({ userId, draftId });
}

module.exports = {
  saveDraft,
  fetchUserDrafts,
  fetchDraftById,
  editDraft,
  removeDraft,
};
