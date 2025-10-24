const mongoose = require("mongoose");
const Market = require("./src/market/market.model");
const Coins = require("./src/cmc-coins/models/cmc-coins.model");

const DATABASE_URI =
  process.env.DATABASE_URI ||
  "mongodb+srv://queckoinc:quecko321@cluster0.89cpk.mongodb.net/cryptobasic?retryWrites=true&w=majority";

async function syncNewMarketCoins() {
  try {
    console.log("🔹 Starting sync of new market coins...");

    // ✅ Connect to DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(DATABASE_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to MongoDB");
    }

    // 1️⃣ Fetch all coins
    const coins = await Coins.find({}, "coinId").lean();
    console.log(`📦 Found ${coins.length} coins in Coins collection`);

    if (!coins.length) {
      console.log("❌ No coins found! Exiting...");
      return;
    }

    // 2️⃣ Extract unique coinIds
    const uniqueCoinIds = Array.from(
      new Set(coins.map((c) => c.coinId).filter(Boolean))
    );
    console.log(`🧩 Extracted ${uniqueCoinIds.length} unique coinIds`);

    // 3️⃣ Check which coinIds already exist in Market
    console.log("🔍 Checking existing coinIds in Market collection...");
    const existing = await Market.find(
      { coinId: { $in: uniqueCoinIds } },
      "coinId"
    ).lean();
    const existingIds = new Set(existing.map((e) => e.coinId));
    console.log(`✅ Found ${existingIds.size} coinIds already in Market`);

    // 4️⃣ Prepare only new coinIds to insert
    const newCoins = uniqueCoinIds
      .filter((id) => !existingIds.has(id))
      .map((id) => ({
        coinId: id,
        createdAt: new Date(),
      }));
    console.log(`✏️ Preparing ${newCoins.length} new coins to insert`);

    if (!newCoins.length) {
      console.log("✅ All coins already exist in Market collection.");
      return;
    }

    // 5️⃣ Insert into Market
    console.log("🚀 Inserting new coins into Market collection...");
    const result = await Market.insertMany(newCoins);
    console.log(
      `🎉 Successfully inserted ${result.length} new market entries.`
    );

    console.log("🔹 Sync complete.");
  } catch (error) {
    console.error("❌ Failed to sync new market coins:", error);
  } finally {
    // ✅ Always close connection
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

if (require.main === module) {
  (async () => {
    console.log("🚀 Running syncNewMarketCoins as standalone script...");
    await syncNewMarketCoins();
    console.log("✅ Finished running syncNewMarketCoins.");
  })();
}

module.exports = syncNewMarketCoins;
