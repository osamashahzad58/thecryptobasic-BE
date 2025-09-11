const mongoose = require("mongoose");

const cmcTopLossersSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      unique: true, // acts like primaryKey
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
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
    currentprice: {
      type: Number,
      required: true,
    },
    marketCapRank: {
      type: Number,
      required: true,
    },
    imageurl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("CmcTopLossers", cmcTopLossersSchema);
