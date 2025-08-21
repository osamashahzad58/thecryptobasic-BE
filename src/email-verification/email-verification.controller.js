const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const emailVerificationsService = require("./email-verification.service");

exports.createCode = async (req, res, next) => {
  try {
    const createCodesDto = {
      ...req.body,
    };
    const result = await emailVerificationsService.createCode(createCodesDto);
    if (result.hasConflict) {
      const error = createError(StatusCodes.CONFLICT, result.conflictMessage);
      error.details = {
        key: result.conflictField,
      };
      throw error;
    }

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Email verification code Sent successfully",
    });
  } catch (ex) {
    next(ex);
  }
};
