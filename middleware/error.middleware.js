const { StatusCodes } = require("http-status-codes");

module.exports = (err, req, res, next) => {
  console.log(err);
  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR);
  err.message = err.statusCode ? err.message : "Something went wrong";

  res.json({
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong",
    details: err.details ? err.details : null,
  });
};
