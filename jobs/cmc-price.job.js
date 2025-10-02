const { CronJob } = require("cron");
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

let batchSize;

// 🔹 Fetch a batch of listings from CoinMarketCap
async function fetchListingsBatch(start = 1, batchSize) {
  const params = {
    start: start.toString(),
    limit: batchSize.toString(),
    convert: "USD",
  };

  console.log("Fetching CMC batch with params:", params);

  const res = await axios.get(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
    {
      params: params,
      headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      timeout: 30000,
    }
  );

  return res.data?.data || [];
}

// 🔹 Fetch and update prices
async function fetchCMCPrice() {
  try {
    console.log("--- Updating CMC Data ---");

    // 1) Total coins from DB
    const totalCoins = await CmcCoins.countDocuments();

    // 2) Decide BATCH_SIZE
    let BATCH_SIZE;
    if (totalCoins > 1000) {
      BATCH_SIZE = Math.ceil(totalCoins / 4); // divide into 4 batches
    } else {
      BATCH_SIZE = totalCoins; // if <1000, take all
    }

    console.log(`Total coins in DB: ${totalCoins}, Batch size: ${BATCH_SIZE}`);

    let start = 1;
    let totalUpdated = 0;
    let batchNumber = 1;

    // 3) Loop until totalCoins are covered
    while (start <= totalCoins) {
      const coins = await fetchListingsBatch(start, BATCH_SIZE);
      if (!coins.length) break;

      // Prepare updates only for existing DB coins
      const updates = await Promise.all(
        coins.map(async (coin) => {
          const exists = await CmcCoins.exists({ coinId: coin.id.toString() });
          if (!exists) return null;

          return {
            updateOne: {
              filter: { coinId: coin.id.toString() },
              update: {
                $set: {
                  price: coin.quote?.USD?.price?.toString() || null,
                  volume_24h: coin.quote?.USD?.volume_24h?.toString() || null,
                  volume_change_24h:
                    coin.quote?.USD?.volume_change_24h?.toString() || null,
                  percent_change_1h:
                    coin.quote?.USD?.percent_change_1h?.toString() || null,
                  percent_change_24h:
                    coin.quote?.USD?.percent_change_24h?.toString() || null,
                  percent_change_7d:
                    coin.quote?.USD?.percent_change_7d?.toString() || null,
                  market_cap: coin.quote?.USD?.market_cap?.toString() || null,
                },
              },
              upsert: false,
            },
          };
        })
      );

      const validUpdates = updates.filter(Boolean);

      if (validUpdates.length) {
        const result = await CmcCoins.bulkWrite(validUpdates, {
          ordered: false,
        });
        totalUpdated += result.modifiedCount;
        console.log(
          `✅ Batch ${batchNumber}: start=${start}, updated ${result.modifiedCount} coins`
        );
      } else {
        console.log(
          `⚠️ Batch ${batchNumber}: start=${start}, no coins to update`
        );
      }

      start += BATCH_SIZE; // move to next batch
      batchNumber++;
    }

    console.log("--- CMC Data Update Complete ---");
    console.log(`💾 Total coins updated in DB: ${totalUpdated}`);
  } catch (err) {
    console.error("❌ Error updating CMC data:", err.message);
    if (err.response) console.error(err.response.data);
  }
}

// 🔹 Initialize cron job
exports.initializeJob = () => {
  // const job = new CronJob("*/20 * * * * *", fetchCMCPrice, null, true);
};
