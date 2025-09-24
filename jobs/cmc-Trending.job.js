const axios = require("axios");
const configs = require("../configs");
const coinsService = require("../src/cmc-coins/cmc-coins.service");

const TRENDING_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/trending/latest";
const QUOTES_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";
const INFO_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";

async function fetchCMCTrending() {
  try {
    console.log("--- Fetching Trending coins started ---");

    const headers = { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey };

    // 1. Fetch trending coins
    const res = await axios.get(TRENDING_URL, {
      headers,
      params: { start: 1, limit: 20 },
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
        sparklineUrl: sparklineUrl,
        timestamp: new Date(),
      });
    }

    if (formattedCoins.length > 0) {
      console.log(formattedCoins.length, "formattedCoins.length");
      await coinsService.deleteTrending();
    }
    await coinsService.addTrending(formattedCoins);
    console.log("Saved trending coins:", formattedCoins.length);

    console.log("--- Fetching Trending coins ended ---");
  } catch (ex) {
    console.error("Error fetching Trending coins:", ex.message);
    if (ex.response) console.error("Response data:", ex.response.data);
  }
}

exports.initializeJob = () => {
  fetchCMCTrending();
  // const job = new CronJob("5 * * * *", fetchCMCTrending, null, true);
};
