const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

// Fetch 24h highs/lows from OHLCV (hourly)
async function get24hHighLow(coinId) {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/ohlcv/historical",
      {
        params: {
          id: coinId,
          convert: "USD",
          time_start: yesterday.toISOString(), // full ISO timestamp
          time_end: now.toISOString(),
          interval: "hourly",
        },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );

    const candles = (res.data && res.data.data && res.data.data.quotes) || [];
    if (!candles.length) {
      console.warn(`No hourly candles returned for coinId=${coinId}`);
      // log raw response for debugging (optional)
      if (res.data)
        console.debug(
          "OHLCV response:",
          JSON.stringify(res.data).slice(0, 1000)
        );
      return { high_24h: null, low_24h: null };
    }

    const highs = candles
      .map((c) => c.quote.USD.high)
      .filter((v) => typeof v === "number");
    const lows = candles
      .map((c) => c.quote.USD.low)
      .filter((v) => typeof v === "number");

    if (!highs.length || !lows.length) {
      console.warn(
        `Hourly candles exist but contain no numeric highs/lows for coinId=${coinId}`
      );
      return { high_24h: null, low_24h: null };
    }

    return {
      high_24h: Math.max(...highs),
      low_24h: Math.min(...lows),
    };
  } catch (err) {
    console.error(
      `Error fetching 24h OHLCV for coinId=${coinId}:`,
      err.message
    );
    if (err.response) console.error("API error:", err.response.data);
    return { high_24h: null, low_24h: null };
  }
}

// Fallback: compute 24h high/low from DB chart entries if API hourly is empty
async function get24hFromDbFallback(coinId) {
  try {
    const doc = await CmcCoins.findOne({ coinId: coinId.toString() }).lean();
    if (!doc || !Array.isArray(doc.chart) || !doc.chart.length) return null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24 = doc.chart.filter(
      (c) => new Date(c.timestamp) >= since && typeof c.price === "number"
    );

    if (!last24.length) return null;

    const prices = last24.map((c) => c.price);
    return {
      high_24h: Math.max(...prices),
      low_24h: Math.min(...prices),
    };
  } catch (err) {
    console.error(
      `Error computing 24h fallback from DB for coinId=${coinId}:`,
      err.message
    );
    return null;
  }
}

// Fetch highs/lows from OHLCV (last 30 days) - unchanged
async function getHighLows(coinId) {
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
          interval: "daily",
        },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );

    const candles = (res.data && res.data.data && res.data.data.quotes) || [];
    if (!candles.length)
      return { monthHigh: null, monthLow: null, ath: null, atl: null };

    const highs = candles
      .map((c) => c.quote.USD.high)
      .filter((v) => typeof v === "number");
    const lows = candles
      .map((c) => c.quote.USD.low)
      .filter((v) => typeof v === "number");

    if (!highs.length || !lows.length)
      return { monthHigh: null, monthLow: null, ath: null, atl: null };

    return {
      monthHigh: Math.max(...highs),
      monthLow: Math.min(...lows),
      ath: Math.max(...highs), // ideally fetch full history for true ATH
      atl: Math.min(...lows),
    };
  } catch (err) {
    console.error(
      `Error fetching 30d OHLCV for coinId=${coinId}:`,
      err.message
    );
    if (err.response) console.error("API error:", err.response.data);
    return { monthHigh: null, monthLow: null, ath: null, atl: null };
  }
}

async function cmcList() {
  try {
    console.log("--- Fetching CMC Data ---");

    // 1. Get listings (price, market data)
    const listingsRes = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        params: { start: "1", limit: "3000", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    const coins = listingsRes.data.data;

    // IDs list
    const ids = coins.map((c) => c.id).join(",");

    // 2. Get coin info (logo, socials)
    const infoRes = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info",
      {
        params: { id: ids },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    const infoData = infoRes.data.data;

    for (const coin of coins) {
      // const sparklineUrl = `https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/${coin.id}.svg`;

      // Snapshot for chart
      const todayData = {
        timestamp: new Date(),
        price: coin.quote && coin.quote.USD ? coin.quote.USD.price : null,
        market_cap:
          coin.quote && coin.quote.USD ? coin.quote.USD.market_cap : null,
        volume: coin.quote && coin.quote.USD ? coin.quote.USD.volume_24h : null,
      };

      // 3. Get highs/lows from OHLCV (30d)
      const { monthHigh, monthLow, ath, atl } = await getHighLows(coin.id);

      // 4. Try to get 24h high/low from OHLCV hourly
      let { high_24h, low_24h } = await get24hHighLow(coin.id);

      // If hourly API returned nulls, fallback to DB computed last-24h values
      if (high_24h == null || low_24h == null) {
        const fallback = await get24hFromDbFallback(coin.id);
        if (fallback) {
          high_24h = fallback.high_24h;
          low_24h = fallback.low_24h;
          console.log(
            `Used DB fallback 24h for ${coin.symbol}: high=${high_24h}, low=${low_24h}`
          );
        } else {
          console.warn(
            `No 24h data available for ${coin.symbol} (${coin.id}) from API or DB fallback.`
          );
        }
      } else {
        console.log(
          `Used OHLCV hourly for ${coin.symbol}: high=${high_24h}, low=${low_24h}`
        );
      }

      let contracts = [];
      if (infoData[coin.id]?.contract_address?.length) {
        contracts = infoData[coin.id].contract_address.map((c) => ({
          platform: c.platform?.name || null,
          symbol: c.platform?.symbol || null,
          contract: c.contract_address || null,
        }));
      }

      // Final payload
      const payload = {
        coinId: coin.id.toString(),
        logo: infoData[coin.id]?.logo || null,
        symbol: coin.symbol,
        name: coin.name,
        slug: coin.slug || infoData[coin.id]?.slug || coin.symbol.toLowerCase(),
        cmcRank: coin.cmc_rank?.toString(),

        price: todayData.price != null ? todayData.price.toString() : null,
        volume_24h:
          todayData.volume != null ? todayData.volume.toString() : null,
        percent_change_1h: coin.quote?.USD?.percent_change_1h?.toString(),
        percent_change_24h: coin.quote?.USD?.percent_change_24h?.toString(),
        percent_change_7d: coin.quote?.USD?.percent_change_7d?.toString(),
        market_cap:
          todayData.market_cap != null ? todayData.market_cap.toString() : null,

        categories: infoData[coin.id]?.tags || [],
        website: infoData[coin.id]?.urls?.website || [],
        // sparkline_7d: sparklineUrl,

        high_24h: high_24h || null,
        low_24h: low_24h || null,

        all_time_high: ath,
        all_time_low: atl,
        month_high: monthHigh,
        month_low: monthLow,
        contracts: contracts,
      };

      // Save / update in DB (push today's snapshot)
      await CmcCoins.findOneAndUpdate(
        { coinId: coin.id.toString() },
        { $set: payload, $push: { chart: todayData } },
        { upsert: true, new: true }
      );

      console.log(`Saved ${coin.name} (${coin.symbol})`);
    }

    console.log("--- Done ---");
  } catch (err) {
    console.error("Error fetching CMC Data:", err.message);
    if (err.response) console.error(err.response.data);
  }
}

exports.initializeJob = () => {
  // Run immediately once
  cmcList();

  // Schedule daily run at midnight
  new CronJob("0 0 * * *", cmcList, null, true);
};
