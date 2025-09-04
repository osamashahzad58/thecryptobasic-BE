const { addSubscription } = require("../subscriptions");
const { getAndInsertCoinsPrice } = require("../../jobs/coins-price-emitters");
const coinmodel = require("../../src/cmc-coins/models/cmc-coins.model");

const handleMessages = (io, socket) => {
  socket.on("join_room", async (payload) => {
    try {
      console.log(payload, "payload:::::::::");

      let { limit, offset, room } = payload.get || {};
      if (!room) {
        room = socket.id; // fallback to socket id if no room provided
      }

      limit = Number(limit);
      offset = Number(offset);

      console.log(limit, offset, room, "limit, offset, room ✅");

      socket.join(room);

      // Save this subscription so cron can replay later
      addSubscription({ limit, offset, room });

      // Send immediate data once
      await getAndInsertCoinsPrice(limit, offset, room, io);
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
  handleMessages(io, socket);
};
