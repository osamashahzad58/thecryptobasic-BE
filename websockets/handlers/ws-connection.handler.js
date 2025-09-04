const redisClient = require("../../helpers/redis");

module.exports.disconnectionHandler = (socket) => {
  socket.on("disconnect", async (reason) => {
    try {
      if (socket.request.user) {
        socket.leave(socket.id);
        await redisClient.del(socket.id);
      }
    } catch (ex) {
      console.log(ex);
    }
  });
};
