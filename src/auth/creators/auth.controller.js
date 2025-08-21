const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service.js");

exports.signup = async (req, res, next) => {
  try {
    const signUpDto = {
      ...req.body,
    };
    const result = await authService.signup(signUpDto);

    if (result?.ex) throw result.ex;

    if (result?.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Creator signup successfully",
      data: result?.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.loginUser = async function (req, res, next) {
  try {
    const logInDto = req.body;
    const result = await authService.loginUser(logInDto);

    if (result.ex) throw result.ex;

    if (result.invalidCreds)
      throw createError(StatusCodes.UNAUTHORIZED, "Sign is not valid");

    // throw error if user not found
    // if (!result.data)
    //   throw createError(StatusCodes.NOT_FOUND, "User not found");
    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Signin Successful",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const signInDto = req.body;

    const result = await authService.signin(signInDto);

    if (result.ex) throw result.ex;

    if (result.creatorIsBlocked)
      throw createError(StatusCodes.FORBIDDEN, "You are blocked");

    // throw error if credentials invlaid
    if (!result.data)
      throw createError(
        StatusCodes.UNAUTHORIZED,
        "Email or password is incorrect"
      );

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Signin Successful",
      data: result.data,
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

    if (result.creatorNotFound) throw createError.Unauthorized();

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      messages: "Access Token creation successful",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const logoutDto = {
      creatorId: req.user.id,
    };
    const result = await authService.logout(logoutDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Logout Successful",
    });
  } catch (ex) {
    next(ex);
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const forgetPasswordDto = {
      ...req.body,
    };
    const result = await authService.forgetPassword(forgetPasswordDto);

    if (result.ex) throw result.ex;

    if (!result.creatorExist)
      throw createError(StatusCodes.NOT_FOUND, "Creator not found");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Password reset link sent via email",
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
      password,
    };
    const result = await authService.resetPassword(resetPasswordDto);

    if (result.ex) throw result.ex;

    if (!result.data)
      throw createError(StatusCodes.NOT_FOUND, "Creator not found");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Your Password has been successfuly changed.",
    });
  } catch (ex) {
    next(ex);
  }
};
