const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const coinsService = require("../src/cmc-coins/cmc-coins.service");

const CoinMarketCapBaseURL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";
const CoinInfoURL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info";

async function fetchCoinInfo(ids) {
  const headers = {
    "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
  };
  const response = await axios.get(`${CoinInfoURL}?id=${ids.join(",")}`, {
    headers,
  });
  return response.data?.data || {};
}

async function fetchCMCTopGainersAndLosers() {
  try {
    console.log(
      "---:::::::::::: Fetching top gainers and losers started :::::::::---"
    );

    const headers = {
      "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
    };

    // Step 1: Fetch top 500 coins by market cap
    const top500Response = await axios.get(
      `${CoinMarketCapBaseURL}?limit=500`,
      { headers }
    );

    if (top500Response.status !== 200) {
      throw new Error("Failed to fetch top 500 coins");
    }

    const top500Coins = top500Response.data?.data || [];

    // Step 2: Sort the top 500 coins by percent_change_24h (descending for gainers and ascending for losers)
    const sortedCoinsByGainers = [...top500Coins].sort(
      (a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h
    );
    const sortedCoinsByLosers = [...top500Coins].sort(
      (a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h
    );

    // Step 3: Get top 20 gainers and losers
    const topGainersIds = sortedCoinsByGainers
      .slice(0, 20)
      .map((coin) => coin.id);
    const topLosersIds = sortedCoinsByLosers
      .slice(0, 20)
      .map((coin) => coin.id);

    // Fetch additional coin info for gainers and losers (including logos)
    const gainersInfo = await fetchCoinInfo(topGainersIds);
    const losersInfo = await fetchCoinInfo(topLosersIds);

    // Delete previous data
    await coinsService.deleteTopAndLoserGainers();

    // Process gainers data
    const topGainers = sortedCoinsByGainers.slice(0, 20).map((coin) => ({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      slug: coin.slug,
      change1h: coin.quote?.USD?.percent_change_24h,
      change24hVol: coin.quote?.USD?.volume_24h,
      currentprice: coin.quote?.USD?.price,
      imageurl: gainersInfo[coin.id]?.logo, // Fetch the logo from additional info
      marketCapRank: coin.cmc_rank,
    }));
    await coinsService.addTopGainers(topGainers);

    // Process losers data
    const topLosers = sortedCoinsByLosers.slice(0, 20).map((coin) => ({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      slug: coin.slug,
      change1h: coin.quote?.USD?.percent_change_24h,
      change24hVol: coin.quote?.USD?.volume_24h,
      currentprice: coin.quote?.USD?.price,
      imageurl: losersInfo[coin.id]?.logo, // Fetch the logo from additional info
      marketCapRank: coin.cmc_rank,
    }));
    await coinsService.addLoserGainers(topLosers);

    console.log("--- Fetching top gainers and losers ended ---");
  } catch (ex) {
    console.error("Error fetching top gainers and losers:", ex.message);
    if (ex.response) {
      console.error("Response data:", ex.response.data);
    }
  }
}

exports.initializeJob = () => {
  fetchCMCTopGainersAndLosers();
  // const job = new CronJob("5 * * * *", fetchCMCTopGainersAndLosers, null, true);
};
