const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const transactionService = require("./transaction.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      userId: req.user?.id,
      ...req.body,
    };

    const result = await transactionService.create(createDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "watchlist create successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.byUserId = async function (req, res, next) {
  try {
    const byUserIdDto = {
      userId: req.user?.id,
    };

    const result = await transactionService.byUserId(byUserIdDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Transaction by User successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
