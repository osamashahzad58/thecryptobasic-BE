const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const adminsService = require("./admins.service");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await adminsService.getDashboardStats();

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Dashboard stats",
      data: result.data
    });
  } catch (ex) {
    next(ex);
  }
};
