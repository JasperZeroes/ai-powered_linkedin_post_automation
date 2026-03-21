const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/postRoutes");
const errorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

const app = express();

/*
Security middleware
*/
app.use(helmet());

/*
CORS
*/
app.use(cors());

/* 
Body parser 
*/
app.use(express.json({ limit: "1mb" }));

/*
Health check
*/
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", authMiddleware, postRoutes);

app.use(errorHandler);

module.exports = app;

