const { CronJob } = require("cron");
const coinmodel = require("../src/cmc-coins/models/cmc-coins.model");
const { getSubscriptions } = require("../websockets/subscriptions");

/**
 * Emit coin prices with pagination
 * @param {number} limit
 * @param {number} offset
 * @param {string} room
 * @param {Server} io
 */
async function getAndInsertCoinsPrice(limit, offset, room, io) {
  console.log(limit, offset, room, "limit, offset, room [emitter]");

  try {
    if (
      !Number.isFinite(limit) ||
      !Number.isFinite(offset) ||
      typeof room !== "string"
    ) {
      throw new Error(
        "limit (number), offset (number), and room (string) are required"
      );
    }
    if (!io || typeof io.to !== "function") {
      throw new Error("socket.io `io` instance is required to emit data");
    }

    console.log("---Coin price Emitter Started---", { limit, offset, room });

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
    console.log(
      "---Coin price Emitter Exception---",
      ex && ex.message ? ex.message : ex
    );
  }
}

/**
 * initializeJob(getIO)
 * - getIO: function that returns the socket.io `io` instance
 */
function initializeJob(getIO) {
  if (typeof getIO !== "function") {
    console.log("initializeJob skipped: supply initializeJob(getIO)");
    return;
  }

  const job = new CronJob("*/10 * * * * *", async () => {
    try {
      const io = getIO();
      if (!io) {
        console.log("Cron skipped: io not available yet");
        return;
      }

      const subs = getSubscriptions();
      if (!subs.length) {
        console.log("No subscriptions yet, cron skipped");
        return;
      }

      for (const { limit, offset, room } of subs) {
        await getAndInsertCoinsPrice(limit, offset, room, io);
      }
    } catch (err) {
      console.log("Cron job error:", err && err.message ? err.message : err);
    }
  });

  job.start();
}

module.exports = { getAndInsertCoinsPrice, initializeJob };
