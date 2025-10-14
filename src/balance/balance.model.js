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
  coinId: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  icon: {
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
  percent_change_1h: {
    type: Number,
    default: 0,
    min: 0,
  },
  percent_change_24h: {
    type: Number,
    default: 0,
    min: 0,
  },
  profitLossUSD: {
    type: Number,
    default: 0,
    min: 0,
  },
  percent_change_7d: {
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
    isMe: {
      type: Boolean,
      default: false,
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "portfolios",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // one wallet per document
    },
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default:
        "https://img.freepik.com/free-photo/silver-bitcoin-cryptocurrency-icon-isolated_53876-14842.jpg?semt=ais_hybrid&w=740&q=80",
    },
    tokens: [tokenSchema], // array of tokens for this wallet
  },
  { timestamps: true }
);

module.exports = mongoose.model("Balance", balanceSchema);
