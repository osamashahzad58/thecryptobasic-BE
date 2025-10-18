const { CronJob } = require("cron");
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

// ===============================
// CONFIG
// ===============================
const CMC_API_BASE =
  "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";
const CRON_SCHEDULE = configs.coinMarketCap?.cronSchedule || "*/60 * * * * *"; // every 30 sec
const REQUEST_TIMEOUT = configs.coinMarketCap?.timeoutMs || 30000;
const MAX_IDS_PER_REQUEST = 1000; // CMC limit per quotes/latest call
const BULK_CHUNK_SIZE = 1000; // Mongo bulk write chunk size

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
    console.log("\n--- Start: Updating CMC Data ---");

    const allCoins = await CmcCoins.find({}, { coinId: 1 }).lean();
    const coinIds = allCoins.map((c) => String(c.coinId));
    const totalCoins = coinIds.length;

    if (!totalCoins) {
      console.log("No coins found in DB.");
      return;
    }

    console.log(`Total coins in DB: ${totalCoins}`);

    const idChunks = chunkArray(coinIds, MAX_IDS_PER_REQUEST);
    let totalUpdated = 0;
    let batchNum = 1;

    for (const chunk of idChunks) {
      try {
        const params = {
          id: chunk.join(","),
          convert: "USD",
        };

        const res = await axios.get(CMC_API_BASE, {
          params,
          headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
          timeout: REQUEST_TIMEOUT,
        });

        const data = res.data?.data || {};
        const coins = Object.values(data);

        if (!coins.length) {
          console.log(`⚠️ Batch ${batchNum}: No data returned for these IDs`);
          batchNum++;
          continue;
        }

        const updates = coins.map((coin) => {
          const usd = coin.quote?.USD || {};
          return {
            updateOne: {
              filter: { coinId: String(coin.id) },
              update: {
                $set: {
                  price: usd.price != null ? String(usd.price) : null,
                  volume_24h:
                    usd.volume_24h != null ? String(usd.volume_24h) : null,
                  volume_change_24h:
                    usd.volume_change_24h != null
                      ? String(usd.volume_change_24h)
                      : null,
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
                  market_cap:
                    usd.market_cap != null ? String(usd.market_cap) : null,
                  last_updated: coin.last_updated || new Date().toISOString(),
                },
              },
              upsert: false,
            },
          };
        });

        const updateChunks = chunkArray(updates, BULK_CHUNK_SIZE);

        for (const [i, chunkOps] of updateChunks.entries()) {
          const result = await CmcCoins.bulkWrite(chunkOps, { ordered: false });
          const modified = result.modifiedCount ?? 0;
          totalUpdated += modified;

          console.log(
            `✅ Batch ${batchNum} (chunk ${i + 1}/${
              updateChunks.length
            }): updated ${modified} coins`
          );
        }
      } catch (err) {
        console.error(`❌ Error in batch ${batchNum}:`, err.message);
        if (err.response?.data) console.error(err.response.data);
      }

      batchNum++;
      await sleep(1000); // avoid API rate limit
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
let jobInstance = null;

exports.initializeJob = () => {
  if (jobInstance) {
    console.log("CMC job already running.");
    return jobInstance;
  }

  jobInstance = new CronJob(CRON_SCHEDULE, fetchCMCPrice, null, true);
  console.log(`Initialized CMC job with cron schedule: "${CRON_SCHEDULE}"`);
  return jobInstance;
};

exports.shutdownJob = async () => {
  if (jobInstance) {
    jobInstance.stop();
    console.log("CMC cron job stopped.");
    jobInstance = null;
  }
};
