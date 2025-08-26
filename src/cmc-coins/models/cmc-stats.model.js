const mongoose = require("mongoose");

const cmcStatsSchema = new mongoose.Schema(
  {
    cryptos: { type: Number, default: 0 },
    exchanges: { type: Number, default: 0 },

    market_cap: { type: Number, default: 0 },
    market_cap_change_24h: { type: Number, default: 0 },

    volume_24h: { type: Number, default: 0 },
    volume_change_24h: { type: Number, default: 0 },

    btc_dominance: { type: Number, default: 0 },
    eth_dominance: { type: Number, default: 0 },
    eth_gas: { type: Number, default: 0 },

    fear_greed: { type: Number, default: 0 },
    fear_greed_label: { type: String, default: "Unknown" },

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
