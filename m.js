/* getMarkets-detailed-logging.js — full automatic mode
   Fetches market data for all coins from CMC and saves into CmcMarket
   with upserted market_id and detailed logging. */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const CmcMarket = require("./src/market/market.model");
const Coins = require("./src/cmc-coins/models/cmc-coins.model");

// ---------- Utility: Logging ----------
function fileLog(line) {
  try {
    const dir = path.join(__dirname, "logs");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    fs.appendFileSync(path.join(dir, "getMarkets.log"), line + "\n");
  } catch {}
}

function now() {
  return new Date().toISOString();
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DATABASE_URI =
  process.env.DATABASE_URI ||
  "mongodb+srv://queckoinc:quecko321@cluster0.89cpk.mongodb.net/cryptobasic?retryWrites=true&w=majority";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  console.log(`[${now()}] 🌐 Connecting to MongoDB...`);
  try {
    await mongoose.connect(DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 20000,
    });
    console.log(`[${now()}] ✅ MongoDB connected`);
  } catch (err) {
    console.error(`[${now()}] ❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}

// ---------- Fetch & Save One Coin ----------
async function getMarketsForCoin(coinId, opts = {}) {
  const {
    apiKey = process.env.CMC_API_KEY || "81d42262-df43-4e72-a05b-7b3a3391d75d",
    limit = 50,
    maxRetries = 3,
    retryBaseDelay = 500,
  } = opts;

  const url =
    "https://pro-api.coinmarketcap.com/v2/cryptocurrency/market-pairs/latest";
  let start = 1;
  let hasMore = true;
  let totalSaved = 0;

  function log(...args) {
    const line = `[${now()}] ${args
      .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
      .join(" ")}`;
    console.log(line);
    fileLog(line);
  }

  const numericId = parseInt(coinId, 10);
  if (isNaN(numericId)) {
    log(`❌ Invalid coinId: ${coinId}`);
    return 0;
  }

  log(`🟢 Starting market fetch for coinId=${numericId}`);

  while (hasMore) {
    const batchStartTime = Date.now();
    log(`📦 Fetching batch: start=${start} limit=${limit}`);

    let attempt = 0;
    let res = null;
    let lastErr = null;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        res = await axios.get(url, {
          params: { id: numericId, start, limit },
          headers: { "X-CMC_PRO_API_KEY": apiKey },
          timeout: 20000,
        });
        log("  ✅ HTTP", { status: res.status });
        break;
      } catch (err) {
        lastErr = err;
        log("  ❌ Request failed", {
          attempt,
          message: err.message,
          code: err.code,
        });
        if (attempt > maxRetries) throw err;
        const delay = retryBaseDelay * Math.pow(2, attempt - 1);
        log(`  ⏳ Retry in ${delay}ms`);
        await wait(delay);
      }
    }

    if (!res)
      throw lastErr || new Error("Unknown error: no response after retries");

    const markets = res.data?.data?.market_pairs || [];
    log(`  ✅ Received ${markets.length} markets.`);

    if (!markets.length) {
      log("⚠️ No more markets found — stopping.");
      hasMore = false;
      break;
    }

    try {
      const docs = markets.map((m) => ({
        coinId: numericId,
        market_id: m.market_id,
        market_pair: m.market_pair,
        category: m.category,
        fee_type: m.fee_type,
        exchange: m.exchange,
        market_pair_base: m.market_pair_base,
        market_pair_quote: m.market_pair_quote,
        quote: m.quote,
        outlier_detected: m.outlier_detected,
        exclusions: m.exclusions,
        fetchedAt: new Date(),
      }));

      const bulkOps = docs.map((doc) => ({
        updateOne: {
          filter: { market_id: doc.market_id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      await CmcMarket.bulkWrite(bulkOps, { ordered: false });
      totalSaved += docs.length;
      log(`  💾 Saved ${docs.length} markets (Total=${totalSaved})`);
    } catch (dbErr) {
      log(`  ❌ bulkWrite error: ${dbErr.message}`);
    }

    start += limit;
    await wait(300);
  }

  log(`🏁 Done coinId=${coinId} (Total saved=${totalSaved})`);
  return totalSaved;
}

// ---------- Master Runner ----------
async function main() {
  await connectDB();

  console.log(`[${now()}] 🧩 Loading coinIds from Coins collection...`);
  const coins = await Coins.find({}, "coinId").lean();
  if (!coins.length) {
    console.log("❌ No coins found in Coins collection — exiting.");
    process.exit(0);
  }

  const uniqueIds = Array.from(
    new Set(coins.map((c) => c.coinId).filter(Boolean))
  );
  console.log(`[${now()}] ✅ Found ${uniqueIds.length} unique coinIds`);

  let totalAll = 0;
  for (const id of uniqueIds) {
    try {
      const count = await getMarketsForCoin(id);
      totalAll += count;
      console.log(`[${now()}] ✅ Completed coinId=${id}, saved=${count}`);
    } catch (err) {
      console.error(`[${now()}] ❌ Failed coinId=${id}: ${err.message}`);
    }

    // Short delay between coins to avoid API limits
    await wait(1000);
  }

  console.log(
    `[${now()}] 🎉 All coins completed. Total markets saved=${totalAll}`
  );
  await mongoose.connection.close();
  console.log(`[${now()}] 🔒 MongoDB connection closed.`);
}

// ---------- CLI Run ----------
if (require.main === module) {
  main().catch((err) => {
    console.error(`[${now()}] ❌ Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { getMarketsForCoin, main };
