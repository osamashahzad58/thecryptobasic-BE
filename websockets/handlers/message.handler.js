const { getAndInsertCoinsPrice } = require("../../jobs/coins-price-emitters");

const handleMessages = (io, socket) => () => {
  socket.on("join_room", async (payload) => {
    try {
      console.log(payload, "payload:::::::::");

      let { limit, offset, room } = payload.get;

      // agar frontend ne room nahi diya to socket.id use karo
      if (!room) {
        room = socket.id;
      }

      console.log(limit, offset, room, "limit, offset, room ✅");

      // user ko apne unique room me join karwao
      socket.join(room);

      // emit coins to this user's room
      await getAndInsertCoinsPrice(Number(limit), Number(offset), room);
    } catch (err) {
      console.log("join_room error:::::::::", err);
      socket.emit("error", {
        status: "SERVER_ERR",
        message: "Something went wrong",
        event: "join_room:sent",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
};

module.exports = (io, socket) => {
  handleMessages(io, socket)();
};
