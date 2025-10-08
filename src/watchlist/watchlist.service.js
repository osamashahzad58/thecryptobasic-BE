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
    const coinsData = await coins.find({}).lean();

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
