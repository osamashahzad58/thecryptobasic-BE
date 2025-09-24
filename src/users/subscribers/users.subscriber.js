const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const mongoose = require("mongoose");
const eventEmitter = require("../../common/events/events.event-emitter");
const USER_EVENTS = require("../constants/users.events.constants");
const emailUtil = require("../../common/email/email.util");
const redisClient = require("../../../helpers/redis");
const EMAIL_VERIFICATION_EVENTS = require("../constants/users.constants");
const emailHelper = require("../../common/email/email.util");

const sendEmailVerificationCode = async (confirmEmailPayload) => {
  try {
    const result = await emailHelper.sendEmail(confirmEmailPayload);
    if (result.ex) throw result.ex;
  } catch (ex) {}
};

exports.registerListeners = () => {
  eventEmitter.on(
    USER_EVENTS.EMAIL_VERIFICATION_EVENTS,
    sendEmailVerificationCode
  );
};
