const { CronJob } = require("cron");
const coinmodel = require("../src/cmc-coins/models/cmc-coins.model");
const {
  getPageSubscriptions,
  getCoinIdSubscriptions,
} = require("../websockets/subscriptions");

// ---- Emit paginated coins ----
async function emitCoinsPrice(limit, offset, room, io) {
  try {
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
  } catch (ex) {
    console.log("emitCoinsPrice error:", ex.message);
  }
}

// ---- Emit single coin byId ----
async function emitCoinById(coinId, room, io) {
  try {
    const coin = await coinmodel
      .findOne({ coinId: String(coinId) })
      .select(
        "coinId logo symbol name price cmcRank market_cap volume_24h volume_change_24h percent_change_1h sparkline_7d updatedAt"
      )
      .lean();

    if (coin) {
      io.to(room).emit("coin_byId", {
        coin,
        room,
        emittedFrom: "Coin byId Emitter",
      });
    }
  } catch (ex) {
    console.log("emitCoinById error:", ex.message);
  }
}

// ---- Cron initializer ----
function initializeJob(getIO) {
  if (typeof getIO !== "function") return;

  const job = new CronJob("*/10 * * * * *", async () => {
    const io = getIO();
    if (!io) return;

    // Paginated rooms
    const pageSubs = getPageSubscriptions();
    for (const { limit, offset, room } of pageSubs) {
      await emitCoinsPrice(limit, offset, room, io);
    }

    // CoinId rooms
    const coinIdSubs = getCoinIdSubscriptions();
    for (const { coinId, room } of coinIdSubs) {
      await emitCoinById(coinId, room, io);
    }
  });

  job.start();
}

module.exports = { emitCoinsPrice, emitCoinById, initializeJob };
