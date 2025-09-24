const userSubscriber = require("../src/users/subscribers/users.subscriber");
// const adminSubscriber = require("../src/admins/subscribers/admins.subscriber");
// const earlyaccessusersSubscriber = require("../src/earlyaccessusers/subscribers/earlyaccessusers.subscriber");
// const usersSubscriber = require("../src/email-verification/subscribers/email-verifications.subscriber");
const app = require("../app"); // import your Express app

const http = require("http").createServer(app);

const { Server } = require("socket.io");
const io = new Server(http);

// register socket handlers
io.on("connection", (socket) => {
  const messageHandler = require("./websockets/handlers/message.handler");
  messageHandler(io, socket);
});

exports.registerSubscribers = function () {
  userSubscriber.registerListeners();
  // adminSubscriber.registerListeners();
  // earlyaccessusersSubscriber.registerListeners();
  // usersSubscriber.registerListeners();
};
