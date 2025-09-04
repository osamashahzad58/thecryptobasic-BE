const { CronJob } = require("cron");
const coinmodel = require("../src/cmc-coins/models/cmc-coins.model");
const webSockets = require("../websockets");

/**
 * Emit coin prices with pagination
 * @param {number} limit - items per page (required)
 * @param {number} offset - skip items (required)
 * @param {string} room - socket room (required)
 */
async function getAndInsertCoinsPrice(limit, offset, room) {
  console.log(limit, offset, room, "limit, offset, room [emitter]");

  try {
    if (
      typeof limit !== "number" ||
      typeof offset !== "number" ||
      typeof room !== "string"
    ) {
      throw new Error("limit, offset, and room are required from frontend");
    }

    console.log("---Coin price Emitter Started---", { limit, offset, room });

    const io = webSockets.getIO();

    const coins = await coinmodel
      .find({})
      .skip(offset)
      .limit(limit)
      .select(
        "coinId logo symbol name price cmcRank market_cap volume_24h volume_change_24h percent_change_1h sparkline_7d updatedAt"
      )
      .lean();

    const totalCount = await coinmodel.countDocuments();

    io.to(room).emit("prices_tomi", {
      coins,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
      limit,
      offset,
      room,
      emittedFrom: "Coin price Emitter",
    });

    console.log("---Coin price Emitter Done---");
  } catch (ex) {
    console.log("---Coin price Emitter Exception---", ex.message);
  }
}

// cron job (broadcast to default room)
function initializeJob() {
  const job = new CronJob("*/10 * * * * *", () => {
    getAndInsertCoinsPrice(100, 0, "broadcast-room");
  });
  job.start();
}

module.exports = { getAndInsertCoinsPrice, initializeJob };
