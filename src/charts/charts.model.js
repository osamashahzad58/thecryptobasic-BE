const mongoose = require("mongoose");

const CmcCoinChartTSSchema = new mongoose.Schema(
  {
    coinId: { type: String, index: true, required: true },
    slug: { type: String, default: null },
    symbol: { type: String, default: null },
    name: { type: String, default: null },
    timestamp: { type: Date, index: true, required: true },
    price: { type: Number },
    market_cap: { type: Number },
    volume: { type: Number },
  },
  {
    collection: "cmc_coin_chart_ts",
    timestamps: false,
  }
);

CmcCoinChartTSSchema.index({ coinId: 1, timestamp: 1 }, { unique: true });

module.exports = mongoose.model(
  "CmcCoinChartTS",
  CmcCoinChartTSSchema,
  "cmc_coin_chart_ts"
);
