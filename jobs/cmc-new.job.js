const axios = require("axios");
const configs = require("../configs");
const coinsService = require("../src/cmc-coins/cmc-coins.service");
const CronJob = require("cron").CronJob;

const NEW_LISTINGS_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/new";
const QUOTES_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
const INFO_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";

async function fetchCMCNewTokens() {
  try {
    console.log("--- Fetching New Tokens started ---");

    const headers = { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey };

    // 1. Fetch new listings
    const res = await axios.get(NEW_LISTINGS_URL, {
      headers,
      params: { limit: 200 },
    });

    const coins = res.data.data || [];
    if (!coins.length) return;

    // Collect IDs
    const ids = coins.map((c) => c.id).join(",");

    // 2. Fetch quotes
    const quotesRes = await axios.get(QUOTES_URL, {
      headers,
      params: { id: ids },
    });

    // 3. Fetch logos
    const infoRes = await axios.get(INFO_URL, {
      headers,
      params: { id: ids },
    });

    const formattedCoins = coins.map((c) => {
      const quote = quotesRes.data.data[c.id]?.quote?.USD || {};
      const info = infoRes.data.data[c.id];

      return {
        coinId: String(c.id),
        name: c.name,
        symbol: c.symbol,
        slug: c.slug,
        change24hVol: quote.volume_change_24h || 0,
        change1h: quote.percent_change_1h || 0,
        price: quote.price || 0,
        marketCapRank: c.cmc_rank || 0,
        logo: info.logo || "",
        sparklineUrl: `https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/${c.id}.svg`,
      };
    });

    if (formattedCoins.length > 0) {
      console.log(formattedCoins, "formattedCoins.length");
      await coinsService.deleteNewTokens();
      await coinsService.addNewTokens(formattedCoins);
    }

    console.log("Saved new tokens:", formattedCoins.length);
    console.log("--- Fetching New Tokens ended ---");
  } catch (ex) {
    console.error("Error fetching New Tokens:", ex.message);
    if (ex.response) console.error("Response data:", ex.response.data);
  }
}

exports.initializeJob = () => {
  // fetchCMCNewTokens();
  const job = new CronJob("10 * * * *", fetchCMCNewTokens, null, true);
  // job.start();
};
