const CronJob = require("cron").CronJob;
const axios = require("axios");
const https = require("https");
const configs = require("../configs");
const CmcStats = require("../src/cmc-coins/models/cmc-stats.model");

// 1. Fetch Global Market Data from CMC
async function fetchCMCGlobal() {
  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    return res.data?.data || {};
  } catch (err) {
    console.error("CMC Global fetch failed:", err.message);
    return {};
  }
}

// 2. Fetch Fear & Greed Index
async function fetchFearGreed() {
  try {
    const res = await axios.get("https://api.alternative.me/fng/?limit=1");
    return res.data?.data?.[0] || {};
  } catch (err) {
    console.error("Fear & Greed fetch failed:", err.message);
    return {};
  }
}

// 3. Fetch Altcoin Season Index with SSL fallback
async function fetchAltcoinSeason() {
  try {
    const res = await axios.get(
      "https://www.blockchaincenter.net/altcoin-season"
    );
    return res.data || {};
  } catch (err) {
    console.warn("AltcoinSeason primary failed, retrying with SSL bypass...");
    try {
      const res = await axios.get(
        "https://api.blockchaincenter.net/altcoin-season",
        {
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );
      return res.data || {};
    } catch (fallbackErr) {
      console.error("AltcoinSeason fetch failed:", fallbackErr.message);
      return { altcoinSeason: 0, altcoinMonth: 0, altcoinYear: 0 };
    }
  }
}

// 4. Fetch ETH Gas (placeholder)
async function fetchEthGas() {
  try {
    // Replace with real API if needed
    return 0.36; // Default value in Gwei
  } catch (err) {
    console.error("ETH Gas fetch failed:", err.message);
    return 0;
  }
}

// 5. Fetch CMC100 Index
async function fetchCMC100() {
  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v3/index/cmc100-latest",
      {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );

    const data = res.data?.data || {};
    const currentValue = data?.value ?? 0;

    // Try direct percent_change_24h
    let change24h = data?.quotes?.USD?.percent_change_24h;

    // If not available, calculate manually
    if (change24h === undefined && data?.value_24h_ago) {
      change24h =
        ((currentValue - data.value_24h_ago) / data.value_24h_ago) * 100;
    }

    return {
      cmc100: currentValue,
      cmc100_change_24h: change24h ?? 0,
    };
  } catch (err) {
    console.error("CMC100 fetch failed:", err.message);
    return { cmc100: 0, cmc100_change_24h: 0 };
  }
}

// Main Job
async function cmcStats() {
  try {
    console.log("\n--- Fetching Stats ---");

    const [marketData, fearGreed, altcoinSeason, ethGas, cmc100Data] =
      await Promise.all([
        fetchCMCGlobal(),
        fetchFearGreed(),
        fetchAltcoinSeason(),
        fetchEthGas(),
        fetchCMC100(),
      ]);

    const stats = {
      cryptos: marketData.active_cryptocurrencies || 0,
      exchanges: marketData.active_exchanges || 0,
      market_cap: marketData.quote?.USD?.total_market_cap || 0,
      market_cap_change_24h:
        marketData.quote?.USD?.total_market_cap_yesterday_percentage_change ||
        0,
      volume_24h: marketData.quote?.USD?.total_volume_24h || 0,
      volume_change_24h:
        marketData.quote?.USD?.total_volume_24h_yesterday_percentage_change ||
        0,
      btc_dominance: marketData.btc_dominance || 0,
      eth_dominance: marketData.eth_dominance || 0,
      eth_gas: ethGas || 0,
      fear_greed: parseInt(fearGreed.value, 10) || 0,
      fear_greed_label: fearGreed.value_classification || "Unknown",
      altcoin_season: altcoinSeason?.altcoinSeason ?? 0,
      altcoin_month: altcoinSeason?.altcoinMonth ?? 0,
      altcoin_year: altcoinSeason?.altcoinYear ?? 0,
      cmc100: cmc100Data.cmc100,
      cmc100_change_24h: cmc100Data.cmc100_change_24h,
      timestamp: new Date(),
    };

    console.log("✅ Final Stats:", stats);
    await CmcStats.create(stats);
    console.log("--- Saved to DB ---");
  } catch (err) {
    console.error("❌ Error fetching Data:", err.message);
  }
}

exports.initializeJob = () => {
  cmcStats();
  new CronJob("0 0 * * *", cmcStats, null, true);
};
