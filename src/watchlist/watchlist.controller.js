const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const watchlistService = require("./watchlist.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      userId: req.user?.id,
      coinId: req.params?.coinId,
    };

    const result = await watchlistService.create(createDto);

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

    const result = await watchlistService.byUserId(byUserIdDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "watchlist by User successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.toggle = async function (req, res, next) {
  try {
    const userId = req.user?.id;
    const coinId = req.query?.coinId;

    const result = await watchlistService.toggle(userId, coinId);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: result.message,
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
