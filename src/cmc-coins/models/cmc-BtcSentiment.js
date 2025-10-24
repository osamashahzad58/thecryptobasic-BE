const mongoose = require("mongoose");

const dataListSchema = new mongoose.Schema({
  score: { type: Number, required: true },
  name: { type: String, required: true },
  timestamp: { type: String, required: true },
  btcPrice: { type: String, required: true },
  btcVolume: { type: String, required: true },
});

const dialConfigSchema = new mongoose.Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  name: { type: String, required: true },
});

const historicalValueSchema = new mongoose.Schema({
  score: { type: Number, required: true },
  name: { type: String, required: true },
  timestamp: { type: String, required: true },
});

const historicalValuesSchema = new mongoose.Schema({
  now: { type: historicalValueSchema, required: true },
  yesterday: { type: historicalValueSchema, required: true },
  lastWeek: { type: historicalValueSchema, required: true },
  lastMonth: { type: historicalValueSchema, required: true },
  yearlyHigh: { type: historicalValueSchema, required: true },
  yearlyLow: { type: historicalValueSchema, required: true },
});

// --- Dominance schemas ---
const dominanceConfigSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  symbol: { type: String },
});

const dominanceValueSchema = new mongoose.Schema({
  timestamp: { type: String },
  mcProportion: { type: Number, required: true },
  mcChangePct30d: { type: Number },
});

const dominanceSchema = new mongoose.Schema({
  configs: { type: [dominanceConfigSchema], default: [] },
  dominance: { type: [dominanceValueSchema], default: [] },
  dominanceLastMonth: { type: [dominanceValueSchema], default: [] },
  dominanceLastWeek: { type: [dominanceValueSchema], default: [] },
  dominanceYesterday: { type: [dominanceValueSchema], default: [] },
  dominanceYearlyHigh: { type: [dominanceValueSchema], default: [] },
  dominanceYearlyLow: { type: [dominanceValueSchema], default: [] },
});

const btcSentimentSchema = new mongoose.Schema(
  {
    dataList: { type: [dataListSchema], required: true },
    dialConfig: { type: [dialConfigSchema], required: true },
    historicalValues: { type: historicalValuesSchema, required: true },
    dominance: { type: dominanceSchema, default: {} },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BtcSentiment", btcSentimentSchema);
