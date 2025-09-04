module.exports.heartbeatHandler = (socket, redisClient) => {
  socket.conn.on("packet", async (packet) => {
    // console.log("pong", redisClient);
    if (packet.type === "pong") {
      const redis = await redisClient.set(socket.id, socket.id, {
        XX: true,
        EX: 30,
      });
      // console.log("redis", redis);
    }
  });
};
