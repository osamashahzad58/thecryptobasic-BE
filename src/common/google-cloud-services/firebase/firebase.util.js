const admin = require("firebase-admin");
const path = require("path");
const { googleCloud } = require("../../../../configs");
const {
  create,
  createNotification,
} = require("../../../notifications/notifications.service");

const serviceAccount = require(path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  googleCloud.firebase.serviceAccountKey
));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.broadcastNotification = async (
  notification,
  fcmTokens,
  result = {}
) => {
  try {
    const notificationOptions = {
      timeToLive: googleCloud.firebase.notificationTTL,
    };
    const notificationMessage = {
      title: notification.title,
      body: notification.message,
    };

    const response = await admin.messaging().sendMulticast({
      notification: notificationMessage,
      tokens: fcmTokens,
    });
    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendPushNotification = async (
  notificationPayload,
  userFcmToken,
  result = {}
) => {
  try {
    const notificationMessage = {
      notification: {
        title: notificationPayload.title,
        body: notificationPayload.body,
      },
      ...(notificationPayload.metadata && {
        data: {
          data: JSON.stringify(notificationPayload.metadata),
        },
      }),
      token: userFcmToken,
    };

    const response = await admin.messaging().send(notificationMessage);
    result.data = response;
  } catch (ex) {
    console.error("Error sending push notification:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.sendNotifications = async (notification, result = {}) => {
  try {
    const notificationMessage = {
      notification: {
        title: notification.title,
        body: notification.desciption,
      },
      ...(notification.metadata && {
        data: {
          data: JSON.stringify(notification.metadata),
        },
      }),
      token: notification.fcmToken,
      android: {
        restrictedPackageName: "com.tomiapp.production",
      },
      apns: {
        payload: {
          aps: {
            "content-available": 1,
            "mutable-content": 1,
            category: "Wallet",
            alert: {
              title: "tomiPAY",
              body: notification.desciption,
            },
          },
        },
      },
    };
    createNotification({
      userId: notification.userId,
      walletAddress: notification.walletAddress,
      title: notification.title,
      desciption: notification.desciption,
      type: notification.type,
    });

    const response = await admin.messaging().send(notificationMessage);
    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.sendNotificationsToAllUsers = async (notification, result = {}) => {
  try {
    const notificationMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      ...(notification.metadata && {
        data: {
          data: JSON.stringify(notification.metadata),
        },
      }),
      token: notification.fcmToken,
      android: {
        restrictedPackageName: "com.tomiapp.production",
      },
      apns: {
        payload: {
          aps: {
            "content-available": 1,
            "mutable-content": 1,
            category: "Wallet",
            alert: {
              title: "tomiPAY",
              body: notification.body,
            },
          },
        },
      },
    };
    const response = await admin.messaging().send(notificationMessage);
    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
