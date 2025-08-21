const eventEmitter = require("../../common/events/events.event-emitter");
const ADMINS_EVENTS = require("../constants/admins.events.constant");
const emailUtil = require("../../common/email/email.util");

const sendPasswordResetEmail = async (passwordResetDto) => {
  try {
    const result = await emailUtil.sendPasswordResetEmail(passwordResetDto);
    if (result.ex) throw result.ex;
  } catch (ex) {
    console.log(ex);
  }
};

const sendPasswordUpdateSuccessEmail = async (passwordUpdateDto) => {
  try {
    const result = await emailUtil.sendPasswordUpdateSuccessEmail(
      passwordUpdateDto
    );
    if (result.ex) throw result.ex;
  } catch (ex) {
    console.log(ex);
  }
};

exports.registerListeners = () => {
  eventEmitter.on(ADMINS_EVENTS.ADMIN_FORGOT_PASSWORD, sendPasswordResetEmail);
  eventEmitter.on(
    ADMINS_EVENTS.ADMIN_PASSWORD_UPDATE,
    sendPasswordUpdateSuccessEmail
  );
};
