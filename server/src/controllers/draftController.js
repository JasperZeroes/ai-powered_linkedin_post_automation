const { validateCreateDraft, validateUpdateDraft } = require("../validators/draft.validator");
const { createUsageEvent } = require("../services/userRepository");

const {
  saveDraft,
  fetchUserDrafts,
  fetchDraftById,
  editDraft,
  removeDraft,
} = require("../services/draftService");

async function createDraft(req, res, next) {
  try {
    const validation = validateCreateDraft(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const draft = await saveDraft({
      userId: req.user.id,
      data: req.body,
    });

    // Record usage event for draft creation
    await createUsageEvent({
      userId: req.user.id,
      sessionId: null, // Can be added if session tracking is implemented
      eventType: "draft",
      eventName: "save_draft",
      metadata: {
        draft_id: draft.id,
        tone: draft.tone,
        goal: draft.goal,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        draft,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getDrafts(req, res, next) {
  try {
    const drafts = await fetchUserDrafts(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        drafts,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getDraftById(req, res, next) {
  try {
    const draft = await fetchDraftById({
      userId: req.user.id,
      draftId: req.params.id,
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        draft,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateDraft(req, res, next) {
  try {
    const validation = validateUpdateDraft(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const draft = await editDraft({
      userId: req.user.id,
      draftId: req.params.id,
      data: req.body,
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        draft,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteDraft(req, res, next) {
  try {
    const deleted = await removeDraft({
      userId: req.user.id,
      draftId: req.params.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "Draft deleted successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDraft,
  getDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
};