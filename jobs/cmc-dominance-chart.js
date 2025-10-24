const axios = require("axios");
const configs = require("../configs");
const CronJob = require("cron").CronJob;
const DominanceChart = require("../src/cmc-coins/models/cmc-dominance-chart");

// CMC Dominance Chart API
const DOMINANCE_CHART_URL =
  "https://api.coinmarketcap.com/data-api/v3/global-metrics/dominance/chart?range=all";

// Fetch and update dominance chart data
async function fetchDominanceChart() {
  try {
    console.log("--- Fetching Global Dominance Chart started ---");

    const res = await axios.get(DOMINANCE_CHART_URL, {
      headers: {
        "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
      },
    });

    const data = res.data?.data;
    if (!data) {
      console.warn("No data returned from CMC Dominance Chart API");
      return;
    }

    // 2. Update (or insert) one fixed document
    const filter = { _id: "68f63f5b02765f1573f0de1f" }; // fixed _id
    const update = {
      configs: data.configs || [],
      points: data.points || [],
      fetchedAt: new Date(),
    };
    const options = { upsert: true, new: true };

    const updatedDoc = await DominanceChart.updateOne(
      filter,
      { $set: update },
      options
    );

    console.log("✅ Dominance Chart updated:", updatedDoc);
  } catch (err) {
    console.error("Error fetching Dominance Chart:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
  }
}

// Initialize Cron Job
exports.initializeJob = () => {
  // Run immediately once (optional)
  fetchDominanceChart();

  // Schedule: run every day at 12:30 AM
  // Cron format: "30 0 * * *"
  // Adjust timing as needed
  //   const job = new CronJob("30 0 * * *", fetchDominanceChart, null, true);
  //   job.start();

  console.log("📈 Dominance Chart Cron job started (every day at 12:30 AM)");
};
