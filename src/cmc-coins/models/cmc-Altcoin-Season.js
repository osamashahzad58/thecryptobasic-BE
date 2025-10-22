const mongoose = require("mongoose");

// Sub-schema for chart points
const PointSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  altcoinIndex: { type: Number, default: 0 },
  altcoinMarketcap: { type: Number, default: 0 },
  timestamp: { type: Number, required: true },
});

// Sub-schema for historical values
const HistoricalValueSchema = new mongoose.Schema({
  now: { type: PointSchema, default: {} },
  yesterday: { type: PointSchema, default: {} },
  lastWeek: { type: PointSchema, default: {} },
  lastMonth: { type: PointSchema, default: {} },
  yearlyHigh: { type: PointSchema, default: {} },
  yearlyLow: { type: PointSchema, default: {} },
});

// Sub-schema for dial configs
const DialConfigSchema = new mongoose.Schema({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  name: { type: String, default: "" },
});

// Sub-schema for top cryptos
const TopCryptoSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  slug: { type: String, required: true },
  logo: { type: String },
  percentChange: { type: Number, default: 0 },
});

const AltcoinSeasonSchema = new mongoose.Schema(
  {
    points: { type: [PointSchema], default: [] },
    historicalValues: { type: HistoricalValueSchema, default: {} },
    dialConfigs: { type: [DialConfigSchema], default: [] },
    topCryptos: { type: [TopCryptoSchema], default: [] },
    fetchedAt: { type: Date, default: Date.now }, // optional timestamp
  },
  { timestamps: true }
);

module.exports = mongoose.model("AltcoinSeason", AltcoinSeasonSchema);
