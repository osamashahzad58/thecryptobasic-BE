const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    isWatchlist: {
      type: Boolean,
      default: false,
    },
    coinId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

watchlistSchema.index({ userId: 1, coinId: 1 }, { unique: true });

module.exports = mongoose.model("watchlist", watchlistSchema);
