const mongoose = require("mongoose");

const cmcStatsSchema = new mongoose.Schema(
  {
    cryptos: { type: Number, default: 0 },
    exchanges: { type: Number, default: 0 },

    market_cap: { type: Number, default: 0 },
    market_cap_change_24h: { type: Number, default: 0 },

    volume_24h: { type: Number, default: 0 },
    volume_change_24h: { type: Number, default: 0 },

    // Dominance fields
    btc_dominance: { type: Number, default: 0 },
    sol_dominance: { type: Number, default: 0 },
    others_dominance: { type: Number, default: 0 },
    eth_dominance: { type: Number, default: 0 },

    eth_gas: { type: Number, default: 0 },

    // Fear & Greed Index fields (updated with historical data)
    fear_greed_now: { type: Number, default: 0 },
    fear_greed_now_label: { type: String, default: "Unknown" },
    fear_greed_yesterday: { type: Number, default: 0 },
    fear_greed_yesterday_label: { type: String, default: "Unknown" },
    fear_greed_last_month: { type: Number, default: 0 },
    fear_greed_last_month_label: { type: String, default: "Unknown" },

    // Altcoin season fields
    altcoin_season: { type: Number, default: 0 },
    altcoin_month: { type: Number, default: 0 },
    altcoin_year: { type: Number, default: 0 },

    // CMC100 index values
    cmc100: { type: Number, default: 0 },
    cmc100_change_24h: { type: Number, default: 0 },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CmcStats", cmcStatsSchema);
