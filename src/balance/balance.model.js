const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  tokenAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true, // for EVM tokens
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
  priceUSD: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalValueUSD: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const balanceSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // one wallet per document
    },
    tokens: [tokenSchema], // array of tokens for this wallet
  },
  { timestamps: true }
);

module.exports = mongoose.model("Balance", balanceSchema);
