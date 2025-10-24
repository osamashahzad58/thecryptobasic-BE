// jobs/cmcHourlyCron.js
const axios = require("axios");
const { CronJob } = require("cron");
const configs = require("../configs"); // if you have config flags, else ignore
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model"); // your coins collection
const CmcCoinChartTS = require("../src/charts/charts.model");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const BATCH_SIZE = 5; // adjust to be safe with API limits
const REQUEST_DELAY_MS = 3000; // wait between batches
const CMC_API_BASE =
  "https://api.coinmarketcap.com/data-api/v3.3/cryptocurrency/detail/chart";

async function fetchChartForCoin(cmcId, slug) {
  // interval=1h returns hourly points; range=All returns full history (or use smaller range)
  const url = `${CMC_API_BASE}?id=${cmcId}&interval=1h&convertId=2781&range=All`;

  const res = await axios.get(url, { timeout: 20000 });
  const points = res.data?.data?.points;
  if (!points || !Array.isArray(points) || points.length === 0) return [];
  // points is an array of { s: "unix_seconds", v: [price, market_cap, volume], c: {} }
  // convert to docs
  return points.map((p) => ({
    coinId: String(cmcId),
    slug,
    timestamp: new Date(Number(p.s) * 1000),
    price: (p.v && p.v[0]) ?? null,
    market_cap: (p.v && p.v[1]) ?? null,
    volume: (p.v && p.v[2]) ?? null,
  }));
}

async function fetchCoinChart() {
  try {
    console.log("📊 Starting hourly CMC data sync...");

    // fetch coins to process (all or a subset). Remove .limit in production
    const allCoins = await CmcCoins.find({}, { coinId: 1, slug: 1 })
      .limit(100)
      .lean();

    if (!allCoins || allCoins.length === 0) {
      console.warn("⚠️ No coins found in CmcCoins collection");
      return;
    }

    console.log(`🪙 Total coins to process: ${allCoins.length}`);

    for (let i = 0; i < allCoins.length; i += BATCH_SIZE) {
      const batch = allCoins.slice(i, i + BATCH_SIZE);
      console.log(
        `🚀 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          allCoins.length / BATCH_SIZE
        )}`
      );

      await Promise.all(
        batch.map(async (coin) => {
          try {
            const cmcId = coin.coinId;
            const slug = coin.slug || coin.symbol || cmcId;
            if (!cmcId || isNaN(Number(cmcId))) {
              console.warn(`Skipping invalid coinId: ${cmcId}`);
              return;
            }

            // fetch docs from CMC data-api
            const docs = await fetchChartForCoin(cmcId, slug);
            if (!docs.length) {
              console.warn(`No points for ${slug} (${cmcId})`);
              return;
            }

            // We may only want to insert points that are newer than existing latest timestamp.
            // Get latest timestamp in DB for this coin to avoid re-upserting entire history:
            const latestInDb = await CmcCoinChartTS.findOne({
              coinId: String(cmcId),
            })
              .sort({ timestamp: -1 })
              .select("timestamp")
              .lean();
            let docsToUpsert = docs;
            if (latestInDb) {
              const lastTs = new Date(latestInDb.timestamp).getTime();
              docsToUpsert = docs.filter((d) => d.timestamp.getTime() > lastTs);
              if (!docsToUpsert.length) {
                console.log(`⏩ ${slug} already up-to-date`);
                return;
              }
            }

            // Bulk upsert docsToUpsert
            const bulkOps = docsToUpsert.map((d) => ({
              updateOne: {
                filter: { coinId: d.coinId, timestamp: d.timestamp },
                update: { $set: d },
                upsert: true,
              },
            }));

            if (bulkOps.length) {
              await CmcCoinChartTS.bulkWrite(bulkOps, { ordered: false });
              console.log(
                `✅ Upserted ${bulkOps.length} new points for ${slug}`
              );
            }
          } catch (err) {
            console.error(
              `❌ Error processing coin ${coin.slug || coin.coinId}:`,
              err.message
            );
            if (err.response?.data) console.error(err.response.data);
          }
        })
      );

      // delay between batches
      if (i + BATCH_SIZE < allCoins.length) {
        console.log(`⏱ Waiting ${REQUEST_DELAY_MS / 1000}s until next batch`);
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log("✅ Hourly CMC sync completed");
  } catch (err) {
    console.error("❌ Fatal error in fetchCoinChart:", err);
  }
}

// Expose initializeJob to start cron from app
exports.initializeJob = () => {
  // Run immediately once, then every hour
  fetchCoinChart();

  // Every hour at minute 0
  const job = new CronJob(
    "0 * * * *",
    fetchCoinChart,
    null,
    true,
    "Asia/Karachi"
  );
  job.start();

  console.log("🕒 CMC hourly cron job started (runs every hour)");
};
