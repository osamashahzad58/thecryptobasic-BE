const admin = require("firebase-admin");
const path = require("path");
const { googleCloud } = require("../../../configs");
const {
  create,
  createNotification,
} = require("../../notifications/notifications.service");

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

// exports.sendNotificationsToAllUsers = async (notification, result = {}) => {
//   try {
//     console.log("send notifications fcmToken", notification);
//     const notificationMessage = {
//       notification: {
//         title: notification.title,
//         body: notification.body,
//       },
//       ...(notification.metadata && {
//         data: {
//           data: JSON.stringify(notification.metadata),
//         },
//       }),
//       token: notification.fcmToken,
//       android: {
//         restrictedPackageName: "com.tomiapp.production",
//       },
//       apns: {
//         payload: {
//           aps: {
//             "content-available": 1,
//             "mutable-content": 1,
//             category: "Wallet",
//             alert: {
//               title: "tomiPAY",
//               body: notification.body,
//             },
//           },
//         },
//       },
//     };
//     const response = await admin.messaging().send(notificationMessage);
//     result.data = response;
//   } catch (ex) {
//     console.log("ex:::::", ex);
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };

exports.sendPushNotification = async (notification, fcmToken, result = {}) => {
  try {
    console.log(notification, fcmToken, "Push notification line 64");
    const notificationMessage = {
      notification: {
        title: notification.title,
        body: notification.description,
      },
      ...(notification.metadata && {
        data: {
          data: JSON.stringify(notification.metadata),
        },
      }),
      token: fcmToken,
    };

    const response = await admin.messaging().send(notificationMessage);
    result.data = response;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
