const mongoose = require("mongoose");

const cmcNewSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
    },
    change24hVol: {
      type: Number,
      required: true,
    },
    change1h: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    marketCapRank: {
      type: Number,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    sparklineUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("CmcNew", cmcNewSchema);
