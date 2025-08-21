const redisClient = require("../../helpers/redis");

module.exports.postAuthenticate = async (socket, next) => {
  try {
    const { user } = socket.handshake;
    const canConnect = await redisClient.set(`user:${user.id}`, socket.id, {
      NX: true,
      EX: 60,
    });

    if (!canConnect) {
      // Instead of throwing an error, disconnect the socket gracefully
      socket.emit("error", { message: "Already logged in" });
    }

    next();
  } catch (ex) {
    const error = new Error("Internal Server Error");
    error.data = {
      reason: "ServerError",
    };
    next(error);
  }
};
