const configs = require("../../../configs");
const { SERVER_ENVIRONMENTS } = require("../../../helpers/constants");

exports.setQuestionScheduleNotificationsTime = () => {
  let twoHoursBeforeEndTimeMS;
  if (configs.serverEnvironment === SERVER_ENVIRONMENTS.PRODUCTION) {
    twoHoursBeforeEndTimeMS = 2 * 60 * 60 * 1000;
  } else {
    twoHoursBeforeEndTimeMS = 1 * 60 * 60 * 1000;
  }

  return twoHoursBeforeEndTimeMS;
};

exports.extendQuestionEndTime = () => {
  let currentTime = new Date();
  if (configs.serverEnvironment === SERVER_ENVIRONMENTS.PRODUCTION) {
    currentTime.setHours(currentTime.getHours() + 2);
  } else {
    currentTime.setMinutes(currentTime.getMinutes() + 3);
  }

  return currentTime;
};
