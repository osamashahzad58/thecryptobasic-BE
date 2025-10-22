const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

async function cmcAddList() {
  try {
    console.log("---:::::::::::: Fetching CMC Data :::::::::---");

    // Step 1: Get latest coins
    const listingsRes = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        params: { start: "2300", limit: "300", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    const coins = listingsRes.data.data;

    // Step 2: Get info for those coins
    const ids = coins.map((c) => c.id).join(",");
    const infoRes = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/info",
      {
        params: { id: ids },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    const infoData = infoRes.data.data;

    for (const coin of coins) {
      const info = infoData[coin.id];
      const sparklineUrl = `https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/${coin.id}.svg`;

      // Step 4: Daily snapshot
      const todayData = {
        timestamp: new Date(),
        price: coin.quote.USD.price,
        market_cap: coin.quote.USD.market_cap,
        volume: coin.quote.USD.volume_24h,
      };

      // Step 5: Payload for DB
      const payload = {
        coinId: coin.id.toString(),
        logo: info?.logo || null,
        symbol: coin.symbol,
        name: coin.name,
        slug: coin.slug,
        cmcRank: coin.cmc_rank?.toString(),

        price: coin.quote.USD.price?.toString(),
        volume_24h: coin.quote.USD.volume_24h?.toString(),
        volume_change_24h: coin.quote.USD.volume_change_24h?.toString(),
        percent_change_1h: coin.quote.USD.percent_change_1h?.toString(),
        percent_change_24h: coin.quote.USD.percent_change_24h?.toString(),
        percent_change_7d: coin.quote.USD.percent_change_7d?.toString(),
        market_cap: coin.quote.USD.market_cap?.toString(),
        market_cap_dominance: coin.quote.USD.market_cap_dominance?.toString(),
        fully_diluted_market_cap:
          coin.quote.USD.fully_diluted_market_cap?.toString(),

        circulating_supply: coin.circulating_supply?.toString(),
        total_supply: coin.total_supply?.toString(),
        max_supply: coin.max_supply?.toString(),
        contracts:
          infoData[coin.id]?.contract_address?.map((c) => ({
            platform: c.platform?.name || null,
            symbol: c.platform?.symbol || null,
            contract: c.contract_address || null,
          })) || [],
        categories: info?.tags || [],
        website: info?.urls?.website || [],
        whitepaper: info?.urls?.technical_doc?.[0] || null,
        socials: {
          twitter: info?.urls?.twitter?.[0] || null,
          reddit: info?.urls?.reddit?.[0] || null,
          telegram: info?.urls?.chat?.[0] || null,
        },
        explorers: info?.urls?.explorer || [],

        sparkline_7d: sparklineUrl,
        high_24h: coin.quote.USD.high_24h || null,
        low_24h: coin.quote.USD.low_24h || null,
      };

      // Step 6: Upsert and push daily chart
      const doc = await CmcCoins.findOneAndUpdate(
        { coinId: coin.id.toString() },
        {
          $set: payload,
          $push: { chart: todayData },
        },
        { upsert: true, new: true }
      );
      console.log(payload, "payload");
      // Step 7: Calculate highs/lows
      if (doc && doc.chart?.length) {
        const now = Date.now();

        const last24h = doc.chart.filter((c) => {
          const timeDiff = now - new Date(c.timestamp).getTime();
          return timeDiff <= 24 * 60 * 60 * 1000;
        });

        const high24h = last24h.length
          ? Math.max(...last24h.map((c) => c.price))
          : null;
        const low24h = last24h.length
          ? Math.min(...last24h.map((c) => c.price))
          : null;

        const allPrices = doc.chart.map((c) => c.price);
        const ath = Math.max(...allPrices);
        const atl = Math.min(...allPrices);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const last30Days = doc.chart.filter(
          (c) => new Date(c.timestamp) >= thirtyDaysAgo
        );

        const monthHigh = last30Days.length
          ? Math.max(...last30Days.map((c) => c.price))
          : null;
        const monthLow = last30Days.length
          ? Math.min(...last30Days.map((c) => c.price))
          : null;

        // Final update
        await CmcCoins.updateOne(
          { coinId: coin.id.toString() },
          {
            $set: {
              high_24h: high24h,
              low_24h: low24h,
              all_time_high: ath,
              all_time_low: atl,
              month_high: monthHigh,
              month_low: monthLow,
            },
          }
        );
      }

      console.log(`Saved ${coin.name} (${coin.symbol})`);
    }

    console.log("---:::::::::::: Done :::::::::---");
  } catch (err) {
    console.error("Error fetching CMC Data:", err.message);
    if (err.response) console.error(err.response.data);
  }
}

exports.initializeJob = () => {
  // Run immediately once
  cmcAddList();
  // Schedule daily run at midnight
  // new CronJob("0 0 * * *", cmcList, null, true);
};
