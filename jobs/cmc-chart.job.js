const axios = require("axios");
const dayjs = require("dayjs");
const mongoose = require("mongoose");
const {
  CmcCoinChartTS,
  createTimeSeriesCollection,
} = require("../models/CmcCoinChartTS");

const CMC_API_BASE =
  "https://api.coinmarketcap.com/data-api/v3.3/cryptocurrency/detail/chart";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchChartForCoin(cmcId, slug) {
  const allDocs = [];
  const startYear = 2011;
  const endYear = new Date().getFullYear();

  console.log(
    `📆 Fetching full history for ${slug} (${startYear} → ${endYear})`
  );

  for (let year = startYear; year <= endYear; year++) {
    const start = dayjs(`${year}-01-01`).unix();
    const end = dayjs(`${year}-12-31`).unix();

    const url = `${CMC_API_BASE}?id=${cmcId}&interval=1h&convertId=2781&start=${start}&end=${end}`;

    try {
      const res = await axios.get(url, { timeout: 20000 });
      const points = res.data?.data?.points;
      if (!points) {
        console.warn(`⚠️ No data for ${slug} in ${year}`);
        continue;
      }

      const docs = Object.values(points).map((p) => ({
        meta: { coinId: String(cmcId), slug },
        timestamp: new Date(p.t * 1000),
        price: p.v[0],
        market_cap: p.v[1],
        volume: p.v[2],
      }));

      console.log(`✅ ${slug}: fetched ${docs.length} points for ${year}`);
      allDocs.push(...docs);
      await delay(1000);
    } catch (err) {
      console.error(`❌ Error fetching ${slug} ${year}:`, err.message);
      await delay(2000);
    }
  }

  console.log(`📦 ${slug} total fetched: ${allDocs.length}`);
  return allDocs;
}

async function saveToTimeSeries(docs, slug) {
  if (!docs?.length) return;
  try {
    const result = await CmcCoinChartTS.insertMany(docs, { ordered: false });
    console.log(`💾 Inserted ${result.length} docs for ${slug}`);
  } catch (err) {
    if (err.writeErrors) {
      console.warn(
        `⚠️ Some duplicates skipped for ${slug}: ${err.writeErrors.length}`
      );
    } else {
      console.error(`❌ Error saving for ${slug}:`, err.message);
    }
  }
}

async function runCron() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/coinsupdate");
    await createTimeSeriesCollection();
    console.log("✅ Mongo connected & time series ready");

    const coins = [{ id: 1, slug: "bitcoin" }];

    for (const coin of coins) {
      console.log(`\n🚀 Processing ${coin.slug}`);
      const docs = await fetchChartForCoin(coin.id, coin.slug);
      await saveToTimeSeries(docs, coin.slug);

      const count = await CmcCoinChartTS.countDocuments({
        "meta.coinId": String(coin.id),
      });
      console.log(`📊 ${coin.slug} total in DB: ${count}`);
    }

    console.log("🎉 Cron finished successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Cron failed:", err);
    await mongoose.disconnect();
  }
}

if (require.main === module) runCron();

module.exports = runCron;
