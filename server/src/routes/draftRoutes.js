const express = require("express");
const router = express.Router();

const {
  createDraft,
  getDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
} = require("../controllers/draftController");

router.post("/", createDraft);
router.get("/", getDrafts);
router.get("/:id", getDraftById);
router.put("/:id", updateDraft);
router.delete("/:id", deleteDraft);

module.exports = router;
