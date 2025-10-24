const mongoose = require("mongoose");

const cmcMarketSchema = new mongoose.Schema(
  {
    coinId: {
      type: Number,
      required: true,
      index: true,
    },
    market_id: {
      type: Number,
      required: true,
      unique: true,
    },
    market_pair: { type: String },
    category: { type: String },
    fee_type: { type: String },
    exchange: { type: Object },
    market_pair_base: { type: Object },
    market_pair_quote: { type: Object },
    quote: { type: Object },
    outlier_detected: { type: Number },
    exclusions: { type: Array },
    fetchedAt: { type: Date },
  },
  { timestamps: true }
);

cmcMarketSchema.index({ market_id: 1 }, { unique: true });
cmcMarketSchema.index({ coinId: 1 });

module.exports = mongoose.model("CmcMarket", cmcMarketSchema);
