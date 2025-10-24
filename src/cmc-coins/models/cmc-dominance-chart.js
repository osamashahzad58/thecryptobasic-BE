const mongoose = require("mongoose");

const dominanceConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const dominancePointSchema = new mongoose.Schema({
  dominance: {
    type: [Number], // [BTC dominance, ETH dominance, Others dominance]
    required: true,
  },
  timestamp: { type: String, required: true },
});

const dominanceChartSchema = new mongoose.Schema(
  {
    configs: { type: [dominanceConfigSchema], required: true },
    points: { type: [dominancePointSchema], required: true },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DominanceChart", dominanceChartSchema);
