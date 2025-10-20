const axios = require("axios");
const configs = require("../configs");
const CronJob = require("cron").CronJob;
const AltcoinSeason = require("../src/cmc-coins/models/cmc-Altcoin-Season");

// CoinMarketCap Altcoin Season API URL
const ALTCOIN_SEASON_URL =
  "https://api.coinmarketcap.com/data-api/v3/altcoin-season/chart";

// 1. Fetch Altcoin Season data from CoinMarketCap
async function fetchAltcoinSeason() {
  try {
    console.log("--- Fetching Altcoin Season started ---");

    const start = Math.floor(Date.now() / 1000) - 30 * 24 * 3600; // last 30 days
    const end = Math.floor(Date.now() / 1000);

    const res = await axios.get(
      `${ALTCOIN_SEASON_URL}?start=${start}&end=${end}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );

    const data = res.data?.data;
    if (!data) {
      console.warn("No data returned from CMC Altcoin Season API");
      return;
    }

    // 2. Update the existing document or create one if it doesn't exist
    const filter = { _id: "68f63f5b02765f1573f0de1e" }; // fixed _id
    const update = {
      points: data.points || [],
      historicalValues: data.historicalValues || {},
      dialConfigs: data.dialConfigs || [],
      topCryptos: data.topCryptos || [],
      fetchedAt: new Date(),
    };
    const options = { upsert: true, new: true };

    const updatedDoc = await AltcoinSeason.updateOne(
      filter,
      { $set: update },
      options
    );

    console.log("✅ Altcoin Season updated:", updatedDoc);
  } catch (err) {
    console.error("Error fetching Altcoin Season:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
  }
}

// 3. Initialize Cron Job
exports.initializeJob = () => {
  // Fetch once immediately
  // fetchAltcoinSeason();
  // Run every day at midnight
  //   const job = new CronJob("0 0 * * *", fetchAltcoinSeason, null, true);
  //   job.start();
  //   console.log("Altcoin Season Cron job started (every day at midnight)");
};
