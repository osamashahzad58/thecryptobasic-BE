const EmailVerification = require("./email-verification.model");
const randomNumber = require("random-number");
const userServices = require("../users/users.service");
const eventEmitter = require("../common/events/events.event-emitter");
const EMAIL_VERIFICATION_EVENTS = require("./constants/email.verification.events.constant");
const CONSTANTS = require("../common/constants/constants");

exports.createCode = async (createCodesDto, result = {}) => {
  try {
    let { email } = createCodesDto;
    console.log(createCodesDto, "createCodesDto");
    const otpCode = randomNumber.generator({
      min: 100000,
      max: 999999,
      integer: true,
    })();

    const existingEmailVerification = await EmailVerification.findOne({
      email,
    });

    if (existingEmailVerification) {
      const updateOtp = await EmailVerification.findOneAndUpdate(
        { email },
        { $set: { otpCode } },
        { new: true }
      );
      console.log(updateOtp, "updateOtp");

      result.data = updateOtp;
    } else {
      const emailVerification = await EmailVerification.create({
        email,
        otpCode,
      });
      console.log(emailVerification, "emailVerification");
      result.data = emailVerification;
    }
    eventEmitter.emit(EMAIL_VERIFICATION_EVENTS.VERIFICATION_CODE, {
      receiverEmail: email,
      codeVerify: otpCode,
    });
  } catch (ex) {
    console.log(ex, "error");
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.verifyEmailCode = async (verifyEmailCodesDto, result = {}) => {
  try {
    const { email, emailVerificationCode } = verifyEmailCodesDto;
    console.log(verifyEmailCodesDto, "verifyEmailCodesDto");

    // Find email verification record in MongoDB

    const emailVerification = await EmailVerification.findOne({
      email,
      otpCode: emailVerificationCode,
      // verificationCodeTimestamp: { $gt: new Date() }, // Using MongoDB's $gt operator for greater than comparison
    });
    console.log(emailVerification, "emailVerification");
    // If email verification record found
    if (emailVerification) {
      result.data = { tokenVerified: true };
    } else {
      result.data = { tokenVerified: false };
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
