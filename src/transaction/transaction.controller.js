const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const transactionService = require("./transaction.service");
const Portfolio = require("../portfolio/portfolio.model");

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
    if (result.nftNotFound)
      throw createError(StatusCodes.NOT_FOUND, "portfolio not found");

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
      limit: req.query?.limit,
      offset: req.query?.offset,
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
exports.allAsset = async function (req, res, next) {
  try {
    const byUserIdDto = {
      userId: req.user?.id,
      limit: req.query?.limit,
      offset: req.query?.offset,
    };

    const result = await transactionService.allAsset(byUserIdDto);

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
exports.stats = async (req, res, next) => {
  try {
    const statsDto = {
      userId: req.user?.id,
      timeFilter: req.query?.timeFilter,
    };
    const result = await transactionService.stats(statsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User stats fetched successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.chart = async (req, res, next) => {
  try {
    const statsDto = {
      userId: req.user?.id,
      timeFilter: req.query?.timeFilter,
    };
    const result = await transactionService.chart(statsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User chart successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
