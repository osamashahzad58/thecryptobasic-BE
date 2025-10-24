const axios = require("axios");
const configs = require("../configs");
const CronJob = require("cron").CronJob;
const BtcSentiment = require("../src/cmc-coins/models/cmc-BtcSentiment");

// API URLs
const FEAR_GREED_URL =
  "https://api.coinmarketcap.com/data-api/v3/fear-greed/chart";
const DOMINANCE_URL =
  "https://api.coinmarketcap.com/data-api/v3/global-metrics/dominance/overview";

// 1. Fetch Fear & Greed Index + Dominance Data
async function fetchFearGreedData() {
  try {
    console.log("--- Fetching Fear & Greed + Dominance data started ---");

    const start = Math.floor(Date.now() / 1000) - 30 * 24 * 3600; // last 30 days
    const end = Math.floor(Date.now() / 1000);

    // Fetch both APIs in parallel
    const [fearGreedRes, dominanceRes] = await Promise.all([
      axios.get(`${FEAR_GREED_URL}?start=${start}&end=${end}`, {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }),
      axios.get(DOMINANCE_URL, {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }),
    ]);

    const fearGreedData = fearGreedRes.data?.data;
    const dominanceData = dominanceRes.data?.data;

    if (!fearGreedData) {
      console.warn("No data returned from CMC Fear & Greed API");
      return;
    }

    if (!dominanceData) {
      console.warn("No data returned from CMC Dominance API");
      return;
    }

    // 2. Prepare update object
    const update = {
      dataList: fearGreedData.dataList || [],
      dialConfig: fearGreedData.dialConfig || [],
      historicalValues: fearGreedData.historicalValues || {},
      dominance: {
        configs: dominanceData.configs || [],
        dominance: dominanceData.dominance || [],
        dominanceLastMonth: dominanceData.dominanceLastMonth || [],
        dominanceLastWeek: dominanceData.dominanceLastWeek || [],
        dominanceYesterday: dominanceData.dominanceYesterday || [],
        dominanceYearlyHigh: dominanceData.dominanceYearlyHigh || [],
        dominanceYearlyLow: dominanceData.dominanceYearlyLow || [],
      },
      fetchedAt: new Date(),
    };

    // 3. Upsert the data into MongoDB
    const filter = { _id: "68f63f5b02765f1573f0de1e" }; // fixed document
    const options = { upsert: true, new: true };

    const updatedDoc = await BtcSentiment.updateOne(
      filter,
      { $set: update },
      options
    );

    console.log("✅ Fear & Greed + Dominance data updated successfully");
  } catch (err) {
    console.error("Error fetching Fear & Greed + Dominance:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
  }
}

// 4. Initialize Cron Job
exports.initializeJob = () => {
  // Uncomment to run immediately
  fetchFearGreedData();
  // Run every day at midnight
  // const job = new CronJob("0 0 * * *", fetchFearGreedData, null, true);
  // job.start();
  // console.log("Fear & Greed Cron job started (daily at midnight)");
};
