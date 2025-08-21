const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service.js");

exports.signin = async (req, res, next) => {
  try {
    const signInDto = req.body;

    const result = await authService.signin(signInDto);

    if (result.ex) throw result.ex;

    // throw error if credentials invlaid
    if (!result.data)
      throw createError(
        StatusCodes.UNAUTHORIZED,
        "Email or password is incorrect"
      );

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Signin Successful",
      data: result.data
    });
  } catch (ex) {
    next(ex);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshTokenDto = req.user;

    const result = await authService.refreshToken(refreshTokenDto);

    if (result.ex) throw result.ex;

    if (result.adminNotFound) throw createError.Unauthorized();

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      messages: "Access Token creation successful",
      data: result.data
    });
  } catch (ex) {
    next(ex);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const logoutDto = {
      adminId: req.user.id
    };
    const result = await authService.logout(logoutDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Logout Successful"
    });
  } catch (ex) {
    next(ex);
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const forgetPasswordDto = {
      ...req.body
    };
    const result = await authService.forgetPassword(forgetPasswordDto);

    if (result.ex) throw result.ex;

    if (!result.adminExist)
      throw createError(StatusCodes.NOT_FOUND, "Admin not found");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Password reset link sent via email"
    });
  } catch (ex) {
    next(ex);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const resetPasswordDto = {
      passwordResetToken: token,
      password
    };
    const result = await authService.resetPassword(resetPasswordDto);

    if (result.ex) throw result.ex;

    if (!result.data)
      throw createError(StatusCodes.NOT_FOUND, "Admin not found");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Your Password has been successfuly changed."
    });
  } catch (ex) {
    next(ex);
  }
};
