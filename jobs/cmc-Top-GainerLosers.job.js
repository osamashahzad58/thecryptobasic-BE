const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const CmcTopGainers = require("../src/cmc-coins/models/cmc-topGainners.model");
const CmcTopLossers = require("../src/cmc-coins/models/cmc-topLosser.model");

const CoinMarketCapBaseURL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";
const CoinInfoURL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";

async function fetchCoinInfo(ids) {
  const headers = { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey };
  const response = await axios.get(`${CoinInfoURL}?id=${ids.join(",")}`, {
    headers,
  });
  return response.data?.data || {};
}

async function fetchTop100GainersAndLosers() {
  try {
    console.log("--- Fetching top 100 coins (24h gainers & losers) ---");

    const headers = { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey };

    // Fetch top 100 coins by market cap
    const response = await axios.get(`${CoinMarketCapBaseURL}?limit=100`, {
      headers,
    });
    const coins = response.data?.data || [];

    if (!coins.length) return console.log("No coins received from CMC");

    // Sort by 24h change
    const gainers = [...coins].sort(
      (a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h
    );
    const losers = [...coins].sort(
      (a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h
    );

    // Top 20 gainers/losers IDs for fetching logos
    const topGainersIds = gainers.slice(0, 500).map((c) => c.id);
    const topLosersIds = losers.slice(0, 500).map((c) => c.id);

    const gainersInfo = await fetchCoinInfo(topGainersIds);
    const losersInfo = await fetchCoinInfo(topLosersIds);

    // Clear old data
    await CmcTopGainers.deleteMany({});
    await CmcTopLossers.deleteMany({});

    // Map gainers to your schema
    const formattedGainers = gainers.slice(0, 500).map((coin) => ({
      coinId: String(coin.id),
      symbol: coin.symbol,
      name: coin.name,
      slug: coin.slug,
      change24hVol: coin.quote.USD.volume_24h,
      change1h: coin.quote.USD.percent_change_1h,
      price: coin.quote.USD.price,
      marketCapRank: coin.cmc_rank,
      imageurl: gainersInfo[coin.id]?.logo || "",
    }));
    await CmcTopGainers.insertMany(formattedGainers);

    // Map losers to your schema
    const formattedLosers = losers.slice(0, 500).map((coin) => ({
      coinId: String(coin.id),
      symbol: coin.symbol,
      name: coin.name,
      slug: coin.slug,
      change24hVol: coin.quote.USD.volume_24h,
      change1h: coin.quote.USD.percent_change_1h,
      price: coin.quote.USD.price,
      marketCapRank: coin.cmc_rank,
      imageurl: losersInfo[coin.id]?.logo || "",
    }));
    await CmcTopLossers.insertMany(formattedLosers);

    console.log(
      "Top 100 24h gainers & losers saved successfully.",
      formattedGainers
    );
  } catch (err) {
    console.error("Error fetching top 100 coins:", err.message);
    if (err.response) console.error("CMC Response:", err.response.data);
  }
}

exports.initializeJob = () => {
  // Run once immediately
  // fetchTop100GainersAndLosers();
  // Schedule to run daily at 00:05
  const job = new CronJob("5 0 * * *", fetchTop100GainersAndLosers, null, true);
};
