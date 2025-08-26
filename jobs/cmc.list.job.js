const CronJob = require("cron").CronJob;
const axios = require("axios");
const configs = require("../configs");
const CmcCoins = require("../src/cmc-coins/models/cmc-coins.model");

async function cmcList() {
  try {
    console.log("---:::::::::::: Fetching CMC Data :::::::::---");

    // get listings
    const listingsRes = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        params: { start: "1", limit: "200", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
      }
    );
    const coins = listingsRes.data.data;

    // get coin info
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
      const sparklineUrl = `https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/${coin.id}.svg`;

      // current snapshot for daily chart
      const todayData = {
        timestamp: new Date(),
        price: coin.quote.USD.price,
        market_cap: coin.quote.USD.market_cap,
        volume: coin.quote.USD.volume_24h,
      };

      const payload = {
        coinId: coin.id.toString(),
        logo: infoData[coin.id]?.logo || null,
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

        website: infoData[coin.id]?.urls?.website || [],
        whitepaper: infoData[coin.id]?.urls?.technical_doc?.[0] || null,
        socials: {
          twitter: infoData[coin.id]?.urls?.twitter?.[0] || null,
          reddit: infoData[coin.id]?.urls?.reddit?.[0] || null,
          telegram: infoData[coin.id]?.urls?.chat?.[0] || null,
        },
        explorers: infoData[coin.id]?.urls?.explorer || [],

        sparkline_7d: sparklineUrl,

        // 24h high/low direct from API
        high_24h: coin.quote.USD.high_24h || null,
        low_24h: coin.quote.USD.low_24h || null,
      };

      // upsert + push daily chart data
      const doc = await CmcCoins.findOneAndUpdate(
        { coinId: coin.id.toString() },
        {
          $set: payload,
          $push: { chart: todayData },
        },
        { upsert: true, new: true }
      );

      // ---- calculate ATH / ATL and Monthly High / Low ----
      if (doc && doc.chart.length) {
        const allPrices = doc.chart.map((c) => c.price);
        const ath = Math.max(...allPrices);
        const atl = Math.min(...allPrices);

        // last 30 days filter
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

        await CmcCoins.updateOne(
          { coinId: coin.id.toString() },
          {
            $set: {
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
  // run immediately once
  cmcList();
  // schedule daily run at midnight
  new CronJob("0 0 * * *", cmcList, null, true);
};
