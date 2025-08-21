const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const usersService = require("../../users/users.service");
const {
  verify2FAToken,
} = require("../../common/verification/google.2FA.verification");
const configs = require("../../../configs");
const cryptLib = require("@skavinvarnan/cryptlib");

exports.signinOTPVerification = async (req, res, next) => {
  try {
    const otpToken = req.body.otpToken;
    const userIdentifier = req.body.userIdentifier;
    const findUserDto = userIdentifier;
    const userResponse = await usersService.findUserOTP(findUserDto);
    if (!userResponse.dataValues) {
      userResponse.userNotFound = true;
      userResponse.conflictMessage = `Invalid auth credentials`;
      throw createError(StatusCodes.NOT_FOUND, userResponse.conflictMessage);
    }

    if (
      userResponse.dataValues.twoFASecretKey &&
      userResponse.dataValues.google2FEnabled === true
    ) {
      if (!otpToken) {
        userResponse.conflictMessage = `OTP-Code is required`;
        throw createError(
          StatusCodes.UNAUTHORIZED,
          userResponse.conflictMessage
        );
      } else {
        const key =
          userResponse.dataValues.id +
          `${configs.userKey}` +
          userResponse.dataValues.userName;
        verified = await verify2FAToken(
          cryptLib.decryptCipherTextWithRandomIV(
            userResponse.dataValues.twoFASecretKey,
            key
          ),
          otpToken
        );
        if (!verified) {
          userResponse.msg = "Invalid OTP-Code, verification failed!";
          throw createError(StatusCodes.UNAUTHORIZED, userResponse.msg);
        }
      }
    }
    if (
      (userResponse.dataValues.google2FEnabled === true && verified) ||
      userResponse.dataValues.google2FEnabled === false
    ) {
      delete userResponse.dataValues.twoFASecretKey;
      next();
    }
  } catch (ex) {
    next(ex);
  }
};
