const axios = require("axios");
const configs = require("../configs");
const CronJob = require("cron").CronJob;
const mongoose = require("mongoose");

const AltcoinSeason = require("../src/cmc-coins/models/cmc-Altcoin-Season");
const CmcCoinsModel = require("../src/cmc-coins/models/cmc-coins.model");

const ALTCOIN_SEASON_URL =
  "https://api.coinmarketcap.com/data-api/v3/altcoin-season/chart";
const CMC_INFO_URL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info";

// Fetch Altcoin Season data
async function fetchAltcoinSeason() {
  try {
    console.log("--- Fetching Altcoin Season started ---");

    const start = Math.floor(Date.now() / 1000) - 30 * 24 * 3600; // last 30 days
    const end = Math.floor(Date.now() / 1000);

    const res = await axios.get(
      `${ALTCOIN_SEASON_URL}?start=${start}&end=${end}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );

    const data = res.data?.data;
    if (!data) {
      console.warn("No data returned from CMC Altcoin Season API");
      return;
    }

    const topCryptos = data.topCryptos || [];

    if (topCryptos.length > 0) {
      // Step 1: Try to get logos from your local DB
      const ids = topCryptos.map((c) => c.id);
      const existingCoins = await CmcCoinsModel.find({ coinId: { $in: ids } })
        .select("coinId logo")
        .lean();

      const logoMap = new Map(
        existingCoins.map((coin) => [coin.coinId, coin.logo])
      );

      // Step 2: Find which coins are missing logos
      const missingIds = ids.filter((id) => !logoMap.has(id));

      // Step 3: Fetch missing logos directly from CoinMarketCap info API
      if (missingIds.length > 0) {
        try {
          const infoRes = await axios.get(
            `${CMC_INFO_URL}?id=${missingIds.join(",")}`,
            {
              headers: {
                "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
              },
            }
          );

          const infoData = infoRes.data?.data || {};
          for (const [coinId, info] of Object.entries(infoData)) {
            if (info.logo) {
              logoMap.set(Number(coinId), info.logo);

              // Save new coin to local DB for next time
              await CmcCoinsModel.updateOne(
                { coinId: Number(coinId) },
                {
                  $set: {
                    coinId: Number(coinId),
                    logo: info.logo,
                    name: info.name,
                    symbol: info.symbol,
                  },
                },
                { upsert: true }
              );
            }
          }
        } catch (infoErr) {
          console.warn(
            "⚠️ Could not fetch missing logos from CMC Info API:",
            infoErr.message
          );
        }
      }

      // Step 4: Attach logos to topCryptos
      data.topCryptos = topCryptos.map((crypto) => ({
        ...crypto,
        logo: logoMap.get(crypto.id) || null,
      }));
    }

    // Step 5: Save or update Altcoin Season document
    const filter = {
      _id: new mongoose.Types.ObjectId("68f63f5b02765f1573f0de1e"),
    };
    const update = {
      points: data.points || [],
      historicalValues: data.historicalValues || {},
      dialConfigs: data.dialConfigs || [],
      topCryptos: data.topCryptos || [],
      fetchedAt: new Date(),
    };
    const options = { upsert: true, new: true };

    await AltcoinSeason.updateOne(filter, { $set: update }, options);

    console.log("✅ Altcoin Season updated successfully!");
  } catch (err) {
    console.error("❌ Error fetching Altcoin Season:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
  }
}

// Initialize Cron Job
exports.initializeJob = () => {
  // Fetch immediately
  fetchAltcoinSeason();

  // Uncomment to run daily at midnight
  // const job = new CronJob("0 0 * * *", fetchAltcoinSeason, null, true);
  // job.start();
  // console.log("Altcoin Season Cron job started (every day at midnight)");
};
