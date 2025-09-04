const axios = require("axios");
const configs = require("../configs");
const coinsService = require("../src/cmc-coins/cmc-coins.service");

const MOST_VISITED_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/trending/most-visited";
const QUOTES_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
const INFO_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";

async function fetchCMCMostVisited() {
  try {
    console.log("--- Fetching Most Visited coins started ---");

    const headers = { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey };

    // 1. Fetch most visited coins
    const res = await axios.get(MOST_VISITED_URL, {
      headers,
      params: { start: 1, limit: 20, time_period: "24h" },
    });

    const coins = res.data.data || [];
    if (!coins.length) return;

    // Collect IDs
    const ids = coins.map((c) => c.id).join(",");

    // 2. Fetch quotes (price, % changes, volume, marketcap)
    const quotesRes = await axios.get(QUOTES_URL, {
      headers,
      params: { id: ids },
    });

    // 3. Fetch logos (images)
    const infoRes = await axios.get(INFO_URL, {
      headers,
      params: { id: ids },
    });

    const formattedCoins = [];
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      const sparklineUrl = `https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/${c.id}.svg`;

      const quote = quotesRes.data.data[c.id].quote.USD;
      const info = infoRes.data.data[c.id];

      formattedCoins.push({
        coinId: c.id,
        name: c.name,
        symbol: c.symbol,
        slug: c.slug,
        rank: c.cmc_rank,
        change24hVol: quote.volume_change_24h,
        change1h: quote.percent_change_1h,
        currentprice: quote.price,
        imageurl: info.logo,
        marketCapRank: c.cmc_rank,
        trafficScore: c.traffic_score,
        sparklineUrl: sparklineUrl,
        timestamp: new Date(),
      });
    }
    if (formattedCoins.length > 0) {
      console.log(formattedCoins.length, "formattedCoins.length");
      await coinsService.deleteMostVisited();
    }
    await coinsService.addMostVisited(formattedCoins);
    console.log("Saved coins:", formattedCoins.length);

    console.log("--- Fetching Most Visited coins ended ---");
  } catch (ex) {
    console.error("Error fetching Most Visited coins:", ex.message);
    if (ex.response) console.error("Response data:", ex.response.data);
  }
}

exports.initializeJob = () => {
  fetchCMCMostVisited();
  // const job = new CronJob("5 * * * *", fetchCMCMostVisited, null, true);
};
