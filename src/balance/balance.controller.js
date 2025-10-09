const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const balanceService = require("./balance.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      ...req.body,
      userId: req.user?.id,
    };

    const result = await balanceService.create(createDto);

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
exports.allAsset = async function (req, res, next) {
  try {
    const byUserIdDto = {
      userId: req.user?.id,
      limit: req.query?.limit,
      offset: req.query?.offset,
    };
    console.log(byUserIdDto, "byUserIdDto");
    const result = await balanceService.allAsset(byUserIdDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "balance by User successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getList = async function (req, res, next) {
  try {
    const getListDto = {
      userId: req.user?.id,
    };

    const result = await balanceService.getList(getListDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "balance by User successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getCombinePortfolio = async function (req, res, next) {
  try {
    const getListDto = {
      userId: req.user?.id,
    };

    const result = await balanceService.getCombinePortfolio(getListDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "balance by User successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
