const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const authService = require("./auth.service.js");
const configs = require("../../../configs");

exports.signin = async (req, res, next) => {
  try {
    const signInDto = req.body;
    const result = await authService.signin(signInDto);

    if (result.ex) throw result.ex;

    // throw error if credentials invlaid
    if (!result.data)
      throw createError(
        StatusCodes.UNAUTHORIZED,
        "Username/Email or password is incorrect"
      );

    // if (!result.data.user.isEmailVerified) throw createError(StatusCodes.FORBIDDEN, 'Pending Email verification');

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Signin Successful",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const signUpDto = { ...req.body };
    const result = await authService.signup(signUpDto);

    if (result.ex) {
      throw result.ex;
    }

    if (result.hasConflict) {
      const conflictStatus = StatusCodes.CONFLICT;
      return res.status(conflictStatus).json({
        statusCode: conflictStatus,
        message: result.conflictMessage,
        conflictField: result.conflictField,
        existingUser: result.existingUser, // agar service se mile
      });
    }

    return res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "Account is created successfully",
      data: result.data, // ab isme accessToken aur refreshToken dono honge
    });
  } catch (ex) {
    next(ex);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const logoutDto = {
      userId: req.user.id,
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

exports.registerUser = async function (req, res, next) {
  try {
    const registersDto = { ...req.body };
    const result = await authService.registerUser(registersDto);
    if (result.ex) throw result.ex;

    // if (result.hasConflict) {
    //   throw createError(
    //     StatusCodes.CONFLICT,
    //     result.data,
    //     result.conflictMessage
    //   );
    // }

    if (result.hasConflict) {
      throw createError(StatusCodes.CONFLICT, result.conflictMessage, {
        details: result.data,
      });
    }

    // if (result.hasConflict) {
    //   const error = createError(
    //     StatusCodes.CONFLICT,
    //     result.conflictMessage,
    //     { details: result.data } // Sending additional data in the `details` field
    //   );

    //   throw error;
    // }

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User added successfully",
      data: result.data,
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
    if (!result.data)
      throw createError(StatusCodes.NOT_FOUND, "User not found");

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
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

    if (result.userNotFound) throw createError.Unauthorized();

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      messages: "Access Token creation successful",
      data: result.data,
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

    if (result.ex) {
      throw result.ex; // Throw the exception directly
    }

    if (!result.userExist) {
      throw createError(StatusCodes.NOT_FOUND, "User not found");
    }

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Password reset link sent via email",
    });
  } catch (ex) {
    next(ex);
  }
};
exports.verify_Email = async (req, res, next) => {
  try {
    const verifyEmailDto = {
      ...req.body,
    };
    const result = await authService.verifyEmail(verifyEmailDto);

    if (result?.ex) throw result.ex;

    if (result?.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.CREATED).json({
      statusCode: StatusCodes.CREATED,
      message: "signup successfully",
      data: result?.data,
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
      throw createError(StatusCodes.NOT_FOUND, "User not found");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Your Password has been successfuly changed.",
    });
  } catch (ex) {
    next(ex);
  }
};
exports.signupWithGoogle = async (req, res, next) => {
  try {
    const { code } = req.body; // frontend se "authorization_code" bhejna hai

    if (!code) {
      throw createError(
        StatusCodes.BAD_REQUEST,
        "Google auth code is required"
      );
    }

    const result = await authService.signupWithGoogle(code);

    if (result.ex) throw result.ex;
    if (!result.data) {
      throw createError(StatusCodes.INTERNAL_SERVER_ERROR, "Signup failed");
    }

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Signup with Google successful",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
