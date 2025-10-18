const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    coinId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // type: {
    //   type: String,
    //   enum: ["buy", "sell", "transfer"],
    //   required: true,
    // },
    type: {
      type: String,
      enum: ["buy", "sell", "transfer", "send", "receive"], // add these
      required: true,
    },
    transferDirection: {
      type: String,
      enum: ["in", "out"],
      required: function () {
        return this.type === "transfer";
      },
    },

    transactionTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity must be positive"],
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "portfolio",
      required: true,
      index: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, "Fee cannot be negative"],
    },
    name: {
      type: String,
      trim: true,
    },
    chainName: {
      type: String,
      trim: true,
    },
    walletAddress: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    symbol: {
      type: String,
      trim: true,
      uppercase: true,
    },
    pricePerCoin: {
      type: Number,
      min: [0, "Price per coin must be positive"],
      required: function () {
        return this.type === "buy" || this.type === "sell";
      },
      default: 0,
    },

    // Only for buys
    totalSpent: {
      type: Number,
      min: [0, "Total spent must be positive"],
      required: function () {
        return this.type === "buy";
      },
      default: 0,
    },

    // Only for sells
    totalReceived: {
      type: Number,
      min: [0, "Total received must be positive"],
      required: function () {
        return this.type === "sell";
      },
      default: 0,
    },
  },
  { timestamps: true }
);

transactionSchema.pre("validate", function (next) {
  if (this.type === "buy") {
    this.totalSpent = this.quantity * this.pricePerCoin + (this.fee || 0);
    this.totalReceived = 0;
  } else if (this.type === "sell") {
    this.totalReceived = this.quantity * this.pricePerCoin - (this.fee || 0);
    this.totalSpent = 0;
  } else if (this.type === "transfer") {
    this.pricePerCoin = 0;
    this.totalSpent = 0;
    this.totalReceived = 0;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
