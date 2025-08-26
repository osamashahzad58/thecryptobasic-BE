const mongoose = require("mongoose");

const cmcCoinsSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      unique: true,
    },
    logo: { type: String, default: null },
    symbol: { type: String, default: null },
    name: { type: String, default: null },
    slug: { type: String, default: null },
    cmcRank: { type: String, default: null },
    price: { type: String, default: null },
    volume_24h: { type: String, default: null },
    volume_change_24h: { type: String, default: null },
    percent_change_1h: { type: String, default: null },
    percent_change_24h: { type: String, default: null },
    percent_change_7d: { type: String, default: null },
    market_cap: { type: String, default: null },
    market_cap_dominance: { type: String, default: null },
    fully_diluted_market_cap: { type: String, default: null },
    circulating_supply: { type: String, default: null },
    total_supply: { type: String, default: null },
    max_supply: { type: String, default: null },
    website: { type: [String], default: [] },
    whitepaper: { type: String, default: null },
    sparkline_7d: { type: String, default: null },
    high_24h: { type: Number, default: null },
    low_24h: { type: Number, default: null },
    all_time_high: { type: Number, default: null },
    all_time_low: { type: Number, default: null },
    month_high: { type: Number, default: null },
    month_low: { type: Number, default: null },

    socials: {
      twitter: { type: String, default: null },
      reddit: { type: String, default: null },
      telegram: { type: String, default: null },
    },
    explorers: { type: [String], default: [] },
    markets: { type: Array, default: [] },
    chart: [
      {
        timestamp: { type: Date },
        price: { type: Number },
        market_cap: { type: Number },
        volume: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CmcCoins", cmcCoinsSchema);
