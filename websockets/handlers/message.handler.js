const {
  addPageSubscription,
  removePageSubscription,
  addCoinIdSubscription,
  removeCoinIdSubscription,
} = require("../subscriptions");
const {
  emitCoinsPrice,
  emitCoinById,
} = require("../../jobs/coins-price-emitters");

const handleMessages = (io, socket) => {
  // Join paginated room
  socket.on("join_room", async (payload) => {
    try {
      let { limit, offset, room } = payload.get || {};
      if (!room) room = socket.id;

      limit = Number(limit);
      offset = Number(offset);

      socket.join(room);
      addPageSubscription({ limit, offset, room });

      await emitCoinsPrice(limit, offset, room, io);
    } catch (err) {
      console.log("join_room error:::::::::", err);
      socket.emit("error", {
        status: "SERVER_ERR",
        message: "Something went wrong",
      });
    }
  });

  // Join room by CoinId
  socket.on("join_room_byId", async (payload) => {
    try {
      console.log(payload, "payload::::::::: [byId]");
      let { coinId, room } = payload.get || {};
      if (!room) room = socket.id;

      if (!coinId) throw new Error("coinId is required");

      socket.join(room);
      addCoinIdSubscription({ coinId, room });

      await emitCoinById(coinId, room, io);
    } catch (err) {
      console.log("join_room_byId error:::::::::", err);
      socket.emit("error", {
        status: "SERVER_ERR",
        message: "Something went wrong",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("remove", socket.id);

    removePageSubscription(socket.id);
    removeCoinIdSubscription(socket.id);
  });
};

module.exports = (io, socket) => {
  handleMessages(io, socket);
};
