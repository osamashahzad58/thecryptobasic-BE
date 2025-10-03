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
exports.byUserId = async ({ userId }, result = {}) => {
  try {
    // Step 1: Get all watchlist entries of this user
    // Example output: [{ userId: 123, coinId: "1", isWatchlist: true }, ...]
    const watchlist = await Watchlist.find({ userId }).lean();

    // Step 2: Get all coin details (only required fields)
    // Example output: [{ coinId: "1", name: "Bitcoin", symbol: "BTC", logo: "..." }, ...]
    const coinsData = await coins
      .find({}, { coinId: 1, name: 1, symbol: 1, logo: 1 })
      .lean();

    // Step 3: Create a lookup object for fast access by coinId
    // Result: { "1": { coinId: "1", name: "Bitcoin", symbol: "BTC", logo: "..." }, ... }
    const coinLookup = {};
    coinsData.forEach((c) => {
      coinLookup[c.coinId] = c;
    });

    // Step 4: Merge watchlist + coin details
    // For each watchlist entry, add coin details from coinLookup
    result.data = watchlist.map((w) => ({
      coinId: w.coinId,
      isWatchlist: w.isWatchlist,
      ...(coinLookup[w.coinId] || {}), // merge coin fields if available
    }));

    // Step 5: Add success message
    result.message = "Watchlist fetched successfully";
  } catch (ex) {
    // Error handling
    result.ex = ex;
  } finally {
    // Always return result (with data or error)
    return result;
  }
};

exports.toggle = async (userId, coinId, result = {}) => {
  try {
    const userObjectId = mongoose.Types.ObjectId(userId);
    const coinIdStr = String(coinId);

    const existing = await Watchlist.findOne({
      userId: userObjectId,
      coinId: coinIdStr,
    });

    if (existing) {
      await Watchlist.deleteOne({ _id: existing._id });
      await coins.updateOne(
        { coinId: coinIdStr },
        { $inc: { watchlistCount: -1 } }
      );

      result.data = { removed: true, coinId: coinIdStr };
      result.message = "Coin removed from watchlist";
    } else {
      const data = await Watchlist.create({
        userId: userObjectId,
        coinId: coinIdStr,
        isWatchlist: true,
      });
      await coins.updateOne(
        { coinId: coinIdStr },
        { $inc: { watchlistCount: 1 } }
      );

      result.data = { added: true, coinId: coinIdStr, watchlist: data };
      result.message = "Coin added to watchlist";
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
