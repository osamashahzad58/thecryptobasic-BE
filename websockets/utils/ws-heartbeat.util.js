const redisClient = require("../../helpers/redis");

module.exports.heartbeatHandler = (socket) => {
  socket.conn.on("packet", async (packet) => {
    if (socket.handshake.user && packet.type === "pong") {
      let d = await redisClient.set(
        `user:${socket.handshake.user.id}`,

        socket.id,
        {
          XX: true,
          EX: 60,
        }
      );
    }
  });
};
