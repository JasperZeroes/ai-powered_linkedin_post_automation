function errorHandler(err, req, res, next) {
  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

module.exports = errorHandler;
