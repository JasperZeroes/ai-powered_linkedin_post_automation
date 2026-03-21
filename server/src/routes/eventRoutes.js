const express = require("express");
const router = express.Router();

const { logEvent } = require("../controllers/eventController");

router.post("/", logEvent);

module.exports = router;