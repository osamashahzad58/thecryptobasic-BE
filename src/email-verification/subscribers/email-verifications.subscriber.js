const eventEmitter = require("../../common/events/events.event-emitter");
const EMAIL_VERIFICATION_EVENTS = require("../constants/email.verification.events.constant");
const emailHelper = require("../../common/email/email.util");

const sendEmailVerificationCode = async (confirmEmailPayload) => {
  try {
    const result = await emailHelper.sendEmailVerificationCode(
      confirmEmailPayload
    );
    if (result.ex) throw result.ex;
  } catch (ex) {}
};

exports.registerListeners = () => {
  eventEmitter.on(
    EMAIL_VERIFICATION_EVENTS.VERIFICATION_CODE,
    sendEmailVerificationCode
  );
};
