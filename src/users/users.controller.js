const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const usersService = require("./users.service");

exports.profile = async function (req, res, next) {
  try {
    const { id } = req.user;
    let picture;
    let coverPicture;

    if (req.files) {
      picture =
        req.files.picture && req.files.picture.length > 0
          ? req.files.picture[0].location
          : undefined;
      coverPicture =
        req.files.coverPicture && req.files.coverPicture.length > 0
          ? req.files.coverPicture[0].location
          : undefined;
    }

    const profileDto = {
      id,
      ...req.body,
      picture,
      coverPicture,
    };
    const result = await usersService.profile(profileDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User updated successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.sendOtp = async (req, res, next) => {
  try {
    const sendOtpDto = {
      id: req.user.id,
      role: req.user.role,
      walletAddress: req.user.walletAddress,
      ...req.body,
    };
    const result = await usersService.sendOtp(sendOtpDto);

    if (result.ex) throw result.ex;

    if (result.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User not found");

    if (result.userEmailNotExist)
      throw createError(
        StatusCodes.BAD_REQUEST,
        "Please enter your name, email ans click 'Save'. Once completed, you will be able to verify your email."
      );

    if (result.userAlreadyVerified)
      throw createError(StatusCodes.CONFLICT, "Already verified");

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Otp Send successfully",
    });
  } catch (ex) {
    next(ex);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const verifyOtpDto = {
      id: req.user.id,
      walletAddress: req.user.walletAddress,
      ...req.body,
    };
    const result = await usersService.verifyOtp(verifyOtpDto);

    if (result.ex) throw result.ex;

    if (result.userNotFound)
      throw createError(StatusCodes.NOT_FOUND, "User not found");

    if (result.optCodeIncorrect)
      throw createError(StatusCodes.BAD_REQUEST, "Otp is incorrect");

    if (result.otpExpired)
      throw createError(StatusCodes.GONE, "Otp is expired");

    return res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Otp verified successfully",
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getUserWatchlist = async function (req, res, next) {
  try {
    const { id: userId } = req.user;
    const result = await usersService.getUserWatchlist({ userId });
    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "User watchlist data",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
