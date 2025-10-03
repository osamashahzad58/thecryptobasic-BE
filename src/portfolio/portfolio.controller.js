const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const portfolioService = require("./portfolio.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      ...req.body,
      userId: req.user?.id,
    };

    const result = await portfolioService.create(createDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "portfolio create successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
