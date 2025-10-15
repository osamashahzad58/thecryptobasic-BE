const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    url: {
      type: String,
      default:
        "https://img.freepik.com/free-photo/silver-bitcoin-cryptocurrency-icon-isolated_53876-14842.jpg?semt=ais_hybrid&w=740&q=80",
    },
    isBlockchain: {
      type: Boolean,
      default: false,
    },
    chainName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("portfolio", portfolioSchema);
