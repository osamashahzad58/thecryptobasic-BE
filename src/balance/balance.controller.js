const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const balanceService = require("./balance.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      ...req.body,
      userId: req.user?.id,
    };
    console.log(createDto, "createDto controller");

    const result = await balanceService.create(createDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "balance create successfully",
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
exports.getByBalance = async (req, res, next) => {
  try {
    const getByBalanceDto = {
      id: req.params.id,
    };

    const result = await balanceService.getByBalance(getByBalanceDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "For single detail successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.stats = async (req, res, next) => {
  try {
    const statsDto = {
      portfolioId: req.query?.portfolioId,
      timeFilter: req.query?.timeFilter,
      userId: req.user?.id,
    };
    const result = await balanceService.balanceStats(statsDto);

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
