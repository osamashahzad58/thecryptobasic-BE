const redisClient = require("../../helpers/redis");

module.exports.disconnectionHandler = (socket) => {
  socket.on("disconnect", async (reason) => {
    try {
      if (socket.handshake.user) {
        socket.leave(socket._id);
        await redisClient.del(`user:${socket.handshake.user.id}`);
      }
    } catch (ex) {
      console.log(ex);
    }
  });
};
