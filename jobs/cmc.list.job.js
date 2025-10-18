const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

const BATCH_SIZE = 20; // reduced to avoid rate limit
const REQUEST_DELAY = 300; // 300ms delay between coin requests

// Helper delay function
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Fetch OHLCV historical data (24h + 30d)
async function getOHLCV(coinId) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical",
      {
        params: {
          id: coinId,
          convert: "USD",
          time_start: thirtyDaysAgo.toISOString().split("T")[0],
          time_end: now.toISOString().split("T")[0],
          interval: "hourly",
        },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );

    const candles = res.data?.data?.quotes || [];
    const highs = candles.map((c) => c.quote.USD.high).filter(Number.isFinite);
    const lows = candles.map((c) => c.quote.USD.low).filter(Number.isFinite);

    const last24hCandles = candles.slice(-24); // last 24 hours (hourly)

    const highs24h = last24hCandles
      .map((c) => c.quote.USD.high)
      .filter(Number.isFinite);
    const lows24h = last24hCandles
      .map((c) => c.quote.USD.low)
      .filter(Number.isFinite);

    return {
      monthHigh: highs.length ? Math.max(...highs) : null,
      monthLow: lows.length ? Math.min(...lows) : null,
      high_24h: highs24h.length ? Math.max(...highs24h) : null,
      low_24h: lows24h.length ? Math.min(...lows24h) : null,
      ath: highs.length ? Math.max(...highs) : null,
      atl: lows.length ? Math.min(...lows) : null,
    };
  } catch (err) {
    return {
      monthHigh: null,
      monthLow: null,
      high_24h: null,
      low_24h: null,
      ath: null,
      atl: null,
    };
  }
}

// Fetch market pairs
async function getMarkets(coinId) {
  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest",
      {
        params: { id: coinId, convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    return res.data?.data?.market_pairs || [];
  } catch {
    return [];
  }
}

// Fetch listings batch
async function fetchListingsBatch(start = 1) {
  const res = await axios.get(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
    {
      params: {
        start: start.toString(),
        limit: BATCH_SIZE.toString(),
        convert: "USD",
      },
      headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
    }
  );
  return res.data?.data || [];
}

// Main job
async function cmcList() {
  try {
    console.log("--- Fetching CMC Data ---");
    let start = 1;
    let more = true;

    while (more) {
      const coins = await fetchListingsBatch(start);
      if (!coins.length) break;

      const ids = coins.map((c) => c.id).join(",");
      const infoRes = await axios.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info",
        {
          params: { id: ids },
          headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
        }
      );
      const infoData = infoRes.data?.data || {};

      for (const coin of coins) {
        const marketCap = coin.quote?.USD?.market_cap || null;
        const percentChange24h = coin.quote?.USD?.percent_change_24h || null;

        const marketCapChange24h =
          marketCap && percentChange24h !== null
            ? marketCap * (percentChange24h / 100)
            : null;

        const todayData = {
          timestamp: new Date(),
          price: coin.quote?.USD?.price || null,
          market_cap: marketCap,
          market_cap_change_24h: marketCapChange24h,
          volume: coin.quote?.USD?.volume_24h || null,
        };
        console.log(todayData, "todayData");
        const { monthHigh, monthLow, high_24h, low_24h, ath, atl } =
          await getOHLCV(coin.id);
        const markets = await getMarkets(coin.id);

        const wallets = infoData[coin.id]?.urls?.wallet || [];
        const audits = infoData[coin.id]?.audit_info_list || [];

        const update = {
          updateOne: {
            filter: { coinId: coin.id.toString() },
            update: {
              $set: {
                coinId: coin.id.toString(),
                logo: infoData[coin.id]?.logo || null,
                symbol: coin.symbol,
                name: coin.name,
                slug:
                  coin.slug ||
                  infoData[coin.id]?.slug ||
                  coin.symbol.toLowerCase(),
                cmcRank: coin.cmc_rank?.toString(),
                price: todayData.price,
                volume_24h: todayData.volume,
                percent_change_1h: coin.quote?.USD?.percent_change_1h,
                percent_change_24h: coin.quote?.USD?.percent_change_24h,
                percent_change_7d: coin.quote?.USD?.percent_change_7d,
                market_cap: todayData.market_cap,
                market_cap_change_24h: todayData.market_cap_change_24h,
                categories: infoData[coin.id]?.tags || [],
                website: infoData[coin.id]?.urls?.website || [],
                wallets,
                audits,
                high_24h,
                low_24h,
                all_time_high: ath,
                all_time_low: atl,
                month_high: monthHigh,
                month_low: monthLow,
                contracts:
                  infoData[coin.id]?.contract_address?.map((c) => ({
                    platform: c.platform?.name || null,
                    symbol: c.platform?.symbol || null,
                    contract: c.contract_address || null,
                  })) || [],
                markets,
              },
              $push: { chart: todayData },
            },
            upsert: true,
          },
        };

        await CmcCoins.bulkWrite([update]);
        await delay(REQUEST_DELAY);
      }

      console.log(`Saved batch starting at ${start}`);
      start += BATCH_SIZE;
      if (coins.length < BATCH_SIZE) more = false;
    }

    console.log("--- Done ---");
  } catch (err) {
    console.error("Error fetching CMC Data:", err.message);
    if (err.response) console.error(err.response.data);
  }
}

exports.initializeJob = () => {
  cmcList(); // run immediately

  new CronJob("10 * * * *", cmcList, null, true); // daily at midnight
  // new CronJob("0 0 * * *", cmcList, null, true); // daily at midnight
};
