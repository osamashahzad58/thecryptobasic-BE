const { CronJob } = require("cron");
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

// ===============================
// CONFIG
// ===============================
const CMC_API_BASE =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
const CRON_SCHEDULE = configs.coinMarketCap?.cronSchedule || "*/60 * * * * *"; // every 60 sec
const REQUEST_TIMEOUT = configs.coinMarketCap?.timeoutMs || 30000;
const BULK_CHUNK_SIZE = 1000;

// ===============================
// HELPERS
// ===============================
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ===============================
// MAIN FUNCTION
// ===============================
async function fetchCMCPrice() {
  try {
    console.log("\n--- Start: Updating CMC Live Data ---");

    const allCoins = await CmcCoins.find({}, { coinId: 1 }).lean();
    const coinIds = allCoins.map((c) => String(c.coinId)).filter(Boolean);
    const totalCoins = coinIds.length;
    console.log(allCoins);
    if (!totalCoins) {
      console.log("No coins found in DB.");
      return;
    }

    console.log(`Total coins in DB: ${totalCoins}`);

    const idChunks = chunkArray(coinIds, 100);
    let totalUpdated = 0;

    for (let i = 0; i < idChunks.length; i++) {
      const idsParam = idChunks[i].join(",");

      // ✅ Log request info before hitting the API
      console.log(
        `\n📡 Fetching data from CMC (chunk ${i + 1}/${idChunks.length})`
      );
      console.log(`Request URL: ${CMC_API_BASE}?id=${idsParam}&convert=USD`);

      const res = await axios.get(CMC_API_BASE, {
        params: { id: idsParam, convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
        timeout: REQUEST_TIMEOUT,
      });

      const data = res.data?.data || {};
      const coins = Object.values(data);

      if (!coins.length) {
        console.log(`⚠️ No data returned for chunk ${i + 1}.`);
        continue;
      }

      // ✅ Log only the very first coin from the first chunk (index 0)
      if (i === 0 && coins[2]) {
        console.log("🔍 First coin from API response (index 0):");
        console.dir(coins[0], { depth: null });
      }

      const updates = [];

      for (const coin of coins) {
        const usd = coin.quote?.USD || {};
        const now = new Date().toISOString();

        updates.push({
          updateOne: {
            filter: { coinId: String(coin.id) },
            update: {
              $set: {
                name: coin.name,
                symbol: coin.symbol,
                slug: coin.slug,
                price: usd.price != null ? String(usd.price) : null,
                volume_24h:
                  usd.volume_24h != null ? String(usd.volume_24h) : null,
                percent_change_1h:
                  usd.percent_change_1h != null
                    ? String(usd.percent_change_1h)
                    : null,
                percent_change_24h:
                  usd.percent_change_24h != null
                    ? String(usd.percent_change_24h)
                    : null,
                percent_change_7d:
                  usd.percent_change_7d != null
                    ? String(usd.percent_change_7d)
                    : null,
                percent_change_30d:
                  usd.percent_change_30d != null
                    ? String(usd.percent_change_30d)
                    : null,
                market_cap:
                  usd.market_cap != null ? String(usd.market_cap) : null,
                fully_diluted_market_cap:
                  usd.fully_diluted_market_cap != null
                    ? String(usd.fully_diluted_market_cap)
                    : null,
                high_24h: usd.high_24h != null ? String(usd.high_24h) : null,
                low_24h: usd.low_24h != null ? String(usd.low_24h) : null,
                last_updated: usd.last_updated || coin.last_updated || now,
                updatedAt: now,
              },
            },
            upsert: false,
          },
        });
      }

      const result = await CmcCoins.bulkWrite(updates, { ordered: false });
      const modified = result.modifiedCount ?? 0;
      totalUpdated += modified;

      console.log(
        `✅ Chunk ${i + 1}/${idChunks.length}: updated ${modified} coins`
      );
      await sleep(200);
    }

    console.log(
      `--- Update Complete. Total coins updated: ${totalUpdated}/${totalCoins} ---`
    );
  } catch (err) {
    console.error("❌ Fatal error in fetchCMCPrice:", err.message);
    if (err.response?.data) console.error(err.response.data);
  }
}

// ===============================
// CRON JOB SETUP
// ===============================
// let jobInstance = null;

// exports.initializeJob = () => {
//   if (jobInstance) {
//     console.log("CMC job already running.");
//     return jobInstance;
//   }

//   jobInstance = new CronJob(CRON_SCHEDULE, fetchCMCPrice, null, true);
//   console.log(`Initialized CMC job with cron schedule: "${CRON_SCHEDULE}"`);
//   return jobInstance;
// };

// exports.shutdownJob = async () => {
//   if (jobInstance) {
//     jobInstance.stop();
//     console.log("CMC cron job stopped.");
//     jobInstance = null;
//   }
// };
exports.initializeJob = () => {
  fetchCMCPrice();
  // const job = new CronJob("5 * * * *", fetchCMCMostVisited, null, true);
};
