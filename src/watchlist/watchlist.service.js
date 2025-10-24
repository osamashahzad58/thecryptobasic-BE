let Watchlist = require("./watchlist.model");
let coins = require("../cmc-coins/models/cmc-coins.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

exports.create = async (createDto, result = {}) => {
  try {
    const data = await Watchlist.create(createDto);
    result.data = data;
  } catch (ex) {
    if (ex.code === 11000) {
      result.ex = {
        message: "This coin is already in the user's watchlist.",
        code: 11000,
      };
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};
// exports.byUserId = async ({ userId }, result = {}) => {
//   try {
//     // 1. Get all watchlist entries for this user
//     const watchlist = await Watchlist.find({ userId }).lean();

//     if (!watchlist.length) {
//       result.data = [];
//       result.message = "No coins in watchlist";
//       return result;
//     }

//     // 2. Extract all coinIds from the watchlist
//     const coinIds = watchlist.map((w) => w.coinId);

//     // 3. Get only coins in the user's watchlist (exclude heavy fields)
//     const coinsData = await coins
//       .find(
//         { coinId: { $in: coinIds } },
//         { markets: 0, chart: 0, __v: 0, categories: 0, explorers: 0 } // exclude fields here
//       )
//       .lean();

//     // 4. Merge coin details with watchlist info
//     const coinLookup = {};
//     coinsData.forEach((c) => {
//       coinLookup[c.coinId] = c;
//     });

//     result.data = watchlist.map((w) => ({
//       ...w,
//       ...(coinLookup[w.coinId] || {}),
//     }));

//     result.message = "Watchlist fetched successfully";
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };
exports.byUserId = async ({ userId }, result = {}) => {
  try {
    if (!userId) {
      result.ex = new Error("userId is required");
      return result;
    }

    // 1. Get all active watchlist entries (isWatchlist: true)
    const watchlist = await Watchlist.find({
      userId,
      isWatchlist: true,
    }).lean();
    if (!watchlist.length) {
      result.data = [];
      result.message = "No active coins in watchlist";
      return result;
    }

    // 2. Extract all coinIds from the active watchlist
    const coinIds = watchlist.map((w) => w.coinId);

    // 3. Fetch coin details for those IDs (exclude heavy fields)
    const coinsData = await coins
      .find(
        { coinId: { $in: coinIds } },
        {
          coinId: 1,
          logo: 1,
          slug: 1,
          price: 1,
          name: 1,
          symbol: 1,
          market_cap: 1,
          percent_change_7d: 1,
          percent_change_24h: 1,
          percent_change_1h: 1,
          volume_change_24h: 1,
          circulating_supply: 1,
          total_supply: 1,
          sparkline_7d: 1,
          volume_24h: 1,
        }
      )
      .lean();

    // 4. Create a lookup map for fast merging
    const coinLookup = {};
    coinsData.forEach((coin) => {
      coinLookup[coin.coinId] = coin;
    });

    // 5. Merge each watchlist entry with its coin details
    result.data = watchlist.map((w) => ({
      ...w,
      ...(coinLookup[w.coinId] || {}),
    }));

    result.message = "Active watchlist fetched successfully";
  } catch (ex) {
    console.error("[Watchlist.byUserId] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.toggle = async (userId, coinId, result = {}) => {
  try {
    if (!userId || !coinId) {
      result.ex = new Error("Missing userId or coinId");
      return result;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const coinIdStr = String(coinId);

    // Check if watchlist record exists
    let existing = await Watchlist.findOne({
      userId: userObjectId,
      coinId: coinIdStr,
    });

    if (existing) {
      // Toggle between true/false
      const newStatus = !existing.isWatchlist;

      // Update the watchlist status
      existing.isWatchlist = newStatus;
      await existing.save();

      // Update coin watchlist count
      await coins.updateOne(
        { coinId: coinIdStr },
        { $inc: { watchlistCount: newStatus ? 1 : -1 } }
      );

      result.data = {
        toggled: true,
        coinId: coinIdStr,
        isWatchlist: newStatus,
        watchlist: existing,
      };
      result.message = newStatus
        ? "Coin added to watchlist"
        : "Coin removed from watchlist";
    } else {
      // Create a new watchlist entry with true status
      const data = await Watchlist.create({
        userId: userObjectId,
        coinId: coinIdStr,
        isWatchlist: true,
      });

      // Increment the watchlist count for the coin
      await coins.updateOne(
        { coinId: coinIdStr },
        { $inc: { watchlistCount: 1 } }
      );

      result.data = {
        added: true,
        coinId: coinIdStr,
        isWatchlist: true,
        watchlist: data,
      };
      result.message = "Coin added to watchlist";
    }
  } catch (ex) {
    console.error("[Watchlist.toggle] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.toggleMultiple = async (userId, coinIds = [], result = {}) => {
  try {
    if (!userId || !Array.isArray(coinIds) || coinIds.length === 0) {
      result.ex = new Error("Missing or invalid userId / coinIds");
      return result;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const updatedResults = [];

    for (const coinId of coinIds) {
      const coinIdStr = String(coinId);

      let existing = await Watchlist.findOne({
        userId: userObjectId,
        coinId: coinIdStr,
      });

      if (existing) {
        const newStatus = !existing.isWatchlist;
        existing.isWatchlist = newStatus;
        await existing.save();

        await coins.updateOne(
          { coinId: coinIdStr },
          { $inc: { watchlistCount: newStatus ? 1 : -1 } }
        );

        updatedResults.push({
          toggled: true,
          coinId: coinIdStr,
          isWatchlist: newStatus,
          watchlist: {
            _id: existing._id,
            userId: existing.userId,
            coinId: existing.coinId,
            isWatchlist: newStatus,
          },
          message: newStatus
            ? "Coin added to watchlist"
            : "Coin removed from watchlist",
        });
      } else {
        const newEntry = await Watchlist.create({
          userId: userObjectId,
          coinId: coinIdStr,
          isWatchlist: true,
        });

        await coins.updateOne(
          { coinId: coinIdStr },
          { $inc: { watchlistCount: 1 } }
        );

        updatedResults.push({
          added: true,
          coinId: coinIdStr,
          isWatchlist: true,
          watchlist: {
            _id: newEntry._id,
            userId: newEntry.userId,
            coinId: newEntry.coinId,
            isWatchlist: true,
          },
          message: "Coin added to watchlist",
        });
      }
    }

    result.data = updatedResults;
    result.message = "Watchlist updated successfully";
  } catch (ex) {
    console.error("[Watchlist.toggleMultiple] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
