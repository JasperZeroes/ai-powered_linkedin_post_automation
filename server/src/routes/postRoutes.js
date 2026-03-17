const express = require("express");
const router = express.Router();
const { generatePost } = require("../controllers/postController");

router.post("/generate", generatePost);

module.exports = router;
