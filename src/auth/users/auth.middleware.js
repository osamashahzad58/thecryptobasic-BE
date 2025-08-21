const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const usersService = require("../../users/users.service");
const {
  verify2FAToken,
} = require("../../common/verification/google.2FA.verification");
const configs = require("../../../configs");
const cryptLib = require("@skavinvarnan/cryptlib");
const emailVerificationsService = require("../../email-verification/email-verification.service");

exports.isOtpValid = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      throw createError(
        StatusCodes.BAD_REQUEST,
        "Email and OTP code are required"
      );
    }
    const emailOtpVerification =
      await emailVerificationsService.verifyEmailCode({
        emailVerificationCode:
          typeof otpCode == "string" ? otpCode.trim() : otpCode,
        email,
      });
    if (emailOtpVerification.ex) throw emailOtpVerification.ex;
    if (!emailOtpVerification.data.tokenVerified) {
      throw createError(
        StatusCodes.UNAUTHORIZED,
        "Email Verification Code is invalid"
      );
    }
    req.body.isEmailVerified = true;
    next();
  } catch (ex) {
    next(ex);
  }
};
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
