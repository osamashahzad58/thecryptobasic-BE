let Transaction = require("./transaction.model");
let Portfolio = require("../portfolio/portfolio.model");
let Coin = require("../cmc-coins/models/cmc-coins.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

exports.create = async (createDto, result = {}) => {
  try {
    const { portfolioId } = createDto;

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      result.nftNotFound = true;
    }

    const data = await Transaction.create(createDto);
    result.data = data;
    result.message = "Transaction created successfully";
  } catch (ex) {
    console.error("[Transaction.create] Error:", ex.message);
    result.ex = ex.message;
  } finally {
    return result;
  }
};

// exports.byUserId = async (byUserIdDto, result = {}) => {
//   try {
//     const { userId } = byUserIdDto;

//     const data = await Transaction.find({
//       userId: mongoose.Types.ObjectId(userId),
//     });
//     result.data = data;
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };
exports.byUserId = async (byUserIdDto, result = {}) => {
  try {
    const { userId, offset, limit } = byUserIdDto;

    // 1. Get total count of transactions for pagination info
    const total = await Transaction.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (total === 0) {
      result.data = { total: 0, limit, offset, items: [] };
      return result;
    }

    // 2. Get paginated transactions
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 }) // newest first
      .skip(Number(offset) || 0)
      .limit(Number(limit) || 10);

    // 3. Extract unique coinIds
    const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];

    // 4. Get corresponding coin data
    const coins = await Coin.find({ coinId: { $in: coinIds } });

    // 5. Build a lookup map for quick coin info access
    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.coinId] = coin;
    }

    // 6. Attach coin info to each transaction
    const items = transactions.map((tx) => {
      const coinInfo = coinMap[tx.coinId] || {};
      return {
        _id: tx._id,
        userId: tx.userId,
        portfolioId: tx.portfolioId,
        type: tx.type,
        transferDirection: tx.transferDirection || null,
        note: tx.note,
        quantity: tx.quantity,
        fee: tx.fee,
        pricePerCoin: tx.pricePerCoin,
        totalSpent: tx.totalSpent,
        totalReceived: tx.totalReceived,
        transactionTime: tx.transactionTime,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        coinInfo: {
          coinId: coinInfo.coinId || tx.coinId,
          logo: coinInfo.logo || null,
          name: coinInfo.name || "",
          symbol: coinInfo.symbol || "",
          price: Number(coinInfo.price || 0),
          market_cap: Number(coinInfo.market_cap || 0),
          percent_change_1h: Number(coinInfo.percent_change_1h || 0),
          percent_change_24h: Number(coinInfo.percent_change_24h || 0),
          percent_change_7d: Number(coinInfo.percent_change_7d || 0),
          volume_change_24h: Number(coinInfo.volume_change_24h || 0),
        },
      };
    });

    // 7. Return structured paginated result
    result.data = {
      total,
      limit: Number(limit),
      offset: Number(offset),
      items,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.allAsset = async (byUserIdDto, result = {}) => {
  try {
    const { userId, offset, limit } = byUserIdDto;

    // 1. Get all user transactions
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!transactions.length) {
      result.data = {
        total: 0,
        limit: Number(limit) || 10,
        offset: Number(offset) || 0,
        totalCurrentValue: 0,
        totalInvestedValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPct: 0,
        items: [],
      };
      return result;
    }

    // 2. Group transactions by coinId to compute holdings
    const holdings = {};
    for (const tx of transactions) {
      const { coinId, type, transferDirection, quantity, pricePerCoin } = tx;

      if (!holdings[coinId]) {
        holdings[coinId] = {
          quantity: 0,
          totalCost: 0,
          totalBuyQty: 0,
        };
      }

      if (type === "buy") {
        holdings[coinId].quantity += quantity;
        holdings[coinId].totalCost += quantity * pricePerCoin;
        holdings[coinId].totalBuyQty += quantity;
      } else if (type === "sell") {
        holdings[coinId].quantity -= quantity;
      } else if (type === "transfer") {
        if (transferDirection === "in") holdings[coinId].quantity += quantity;
        else if (transferDirection === "out")
          holdings[coinId].quantity -= quantity;
      }
    }

    // 3. Fetch coin data
    const coinIds = Object.keys(holdings);
    const coins = await Coin.find({ coinId: { $in: coinIds } })
      .skip(Number(offset) || 0)
      .limit(Number(limit) || 10);

    // 4. Compute stats for each coin
    const items = coins.map((coin) => {
      const h = holdings[coin.coinId] || {};
      const qty = h.quantity || 0;
      const avgBuyPrice = h.totalBuyQty > 0 ? h.totalCost / h.totalBuyQty : 0;

      const currentPrice = Number(coin.price || 0);
      const currentValue = qty * currentPrice;
      const investedValue = qty * avgBuyPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPct =
        investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        coinId: coin.coinId,
        name: coin.name || "",
        symbol: coin.symbol || "",
        logo: coin.logo || null,
        price: Number(currentPrice.toFixed(2)),
        percent_change_1h: Number(coin.percent_change_1h || 0),
        percent_change_24h: Number(coin.percent_change_24h || 0),
        percent_change_7d: Number(coin.percent_change_7d || 0),
        balance: Number(qty.toFixed(8)),
        value: Number(currentValue.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
        profitLossPct: Number(profitLossPct.toFixed(2)),
        market_cap: Number(coin.market_cap || 0),
        volume_change_24h: Number(coin.volume_change_24h || 0),
      };
    });

    // 5. Portfolio totals
    const totalCurrentValue = items.reduce((sum, c) => sum + c.value, 0);
    const totalInvestedValue = items.reduce(
      (sum, c) => sum + c.balance * (c.value / Math.max(c.price, 1)),
      0
    );
    const totalProfitLoss = totalCurrentValue - totalInvestedValue;
    const totalProfitLossPct =
      totalInvestedValue > 0 ? (totalProfitLoss / totalInvestedValue) * 100 : 0;

    result.data = {
      total: coinIds.length,
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalInvestedValue: Number(totalInvestedValue.toFixed(2)),
      totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
      totalProfitLossPct: Number(totalProfitLossPct.toFixed(2)),
      items,
    };
  } catch (ex) {
    console.error("[allAsset] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.allAsset = async (byUserIdDto, result = {}) => {
  try {
    const { userId, offset, limit } = byUserIdDto;

    // 1. Get all user transactions
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!transactions.length) {
      result.data = {
        total: 0,
        limit: Number(limit) || 10,
        offset: Number(offset) || 0,
        totalCurrentValue: 0,
        totalInvestedValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPct: 0,
        items: [],
      };
      return result;
    }

    // 2. Group transactions by coinId to compute holdings
    const holdings = {};
    for (const tx of transactions) {
      const { coinId, type, transferDirection, quantity, pricePerCoin } = tx;

      if (!holdings[coinId]) {
        holdings[coinId] = {
          quantity: 0,
          totalCost: 0,
          totalBuyQty: 0,
        };
      }

      if (type === "buy") {
        holdings[coinId].quantity += quantity;
        holdings[coinId].totalCost += quantity * pricePerCoin;
        holdings[coinId].totalBuyQty += quantity;
      } else if (type === "sell") {
        holdings[coinId].quantity -= quantity;
      } else if (type === "transfer") {
        if (transferDirection === "in") holdings[coinId].quantity += quantity;
        else if (transferDirection === "out")
          holdings[coinId].quantity -= quantity;
      }
    }

    // 3. Fetch coin data
    const coinIds = Object.keys(holdings);
    const coins = await Coin.find({ coinId: { $in: coinIds } })
      .skip(Number(offset) || 0)
      .limit(Number(limit) || 10);

    // 4. Compute stats for each coin
    const items = coins.map((coin) => {
      const h = holdings[coin.coinId] || {};
      const qty = h.quantity || 0;
      const avgBuyPrice = h.totalBuyQty > 0 ? h.totalCost / h.totalBuyQty : 0;

      const currentPrice = Number(coin.price || 0);
      const currentValue = qty * currentPrice;
      const investedValue = qty * avgBuyPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPct =
        investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        coinId: coin.coinId,
        name: coin.name || "",
        symbol: coin.symbol || "",
        logo: coin.logo || null,
        price: Number(currentPrice.toFixed(2)),
        percent_change_1h: Number(coin.percent_change_1h || 0),
        percent_change_24h: Number(coin.percent_change_24h || 0),
        percent_change_7d: Number(coin.percent_change_7d || 0),
        balance: Number(qty.toFixed(8)),
        value: Number(currentValue.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
        profitLossPct: Number(profitLossPct.toFixed(2)),
        market_cap: Number(coin.market_cap || 0),
        volume_change_24h: Number(coin.volume_change_24h || 0),
      };
    });

    // 5. Portfolio totals
    const totalCurrentValue = items.reduce((sum, c) => sum + c.value, 0);
    const totalInvestedValue = items.reduce(
      (sum, c) => sum + c.balance * (c.value / Math.max(c.price, 1)),
      0
    );
    const totalProfitLoss = totalCurrentValue - totalInvestedValue;
    const totalProfitLossPct =
      totalInvestedValue > 0 ? (totalProfitLoss / totalInvestedValue) * 100 : 0;

    result.data = {
      total: coinIds.length,
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalInvestedValue: Number(totalInvestedValue.toFixed(2)),
      totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
      totalProfitLossPct: Number(totalProfitLossPct.toFixed(2)),
      items,
    };
  } catch (ex) {
    console.error("[allAsset] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.stats = async (statsDto, result = {}) => {
  try {
    const { userId, timeFilter } = statsDto;

    const portfolios = await Portfolio.find({
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!portfolios.length) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        distribution: [],
        topCoins: [],
        assetsChart: [],
        diversimeter: { hhi: 0, level: "None" },
        portfolioHealth: { score: 0, label: "None" },
      };
      return result;
    }

    const portfolioIds = portfolios.map((p) => p._id);

    const filter = { portfolioId: { $in: portfolioIds } };
    if (timeFilter) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(timeFilter));
      filter.transactionTime = { $gte: startDate };
    }

    const transactions = await Transaction.find(filter);
    if (!transactions.length) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        distribution: [],
        topCoins: [],
        assetsChart: [],
        diversimeter: { hhi: 0, level: "None" },
        portfolioHealth: { score: 0, label: "None" },
      };
      return result;
    }

    const holdings = {};
    const coinIds = new Set();
    transactions.forEach((tx) => {
      const coinId = tx.coinId;
      coinIds.add(coinId);
      let qty = holdings[coinId] || 0;
      if (tx.type === "buy") qty += tx.quantity;
      else if (tx.type === "sell") qty -= tx.quantity;
      else if (tx.type === "transfer") {
        if (tx.transferDirection === "in") qty += tx.quantity;
        else if (tx.transferDirection === "out") qty -= tx.quantity;
      }
      holdings[coinId] = qty;
    });

    const coins = await Coin.find({ coinId: { $in: Array.from(coinIds) } });

    let totalValue = 0;
    let totalChange24h = 0;
    const distribution = [];

    coins.forEach((coin) => {
      const qty = holdings[coin.coinId] || 0;
      const value = qty * (coin.price || 0);
      totalValue += value;
      totalChange24h += value * ((coin.percent_change_24h || 0) / 100);
      distribution.push({
        coinId: coin.coinId,
        name: coin.name,
        symbol: coin.symbol,
        logo: coin.logo,
        qty,
        price: coin.price || 0,
        value,
        pct: 0,
        percent_change_24h: coin.percent_change_24h || 0,
      });
    });

    distribution.forEach(
      (d) =>
        (d.pct = totalValue ? ((d.value / totalValue) * 100).toFixed(2) : 0)
    );

    const topCoins = [...distribution]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const days = timeFilter || 7;
    const assetsChart = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      assetsChart.push({ dateOffsetDays: i, value: totalValue });
    }

    const hhi = distribution.reduce((acc, d) => acc + Math.pow(d.pct, 2), 0);
    const diversimeter = {
      hhi,
      level: hhi < 1500 ? "Low Risk" : hhi < 3000 ? "Medium Risk" : "High Risk",
    };

    const portfolioHealth = {
      score: Math.min(100, Math.round(totalValue / 1000)),
      label:
        totalValue < 50000 ? "Low" : totalValue < 100000 ? "Neutral" : "Good",
    };

    const totalChange24hPct = totalValue
      ? (totalChange24h / (totalValue - totalChange24h)) * 100
      : 0;

    result.data = {
      totalValue,
      totalChange24h,
      totalChange24hPct: Number(totalChange24hPct.toFixed(2)),
      distribution,
      topCoins,
      assetsChart,
      diversimeter,
      portfolioHealth,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

// exports.chart = async (chartDto, result = {}) => {
//   try {
//     const { userId, timeFilter, portfolioId } = chartDto;

//     // 1. Get user's portfolios
//     const portfolios = await Portfolio.find({
//       userId: new mongoose.Types.ObjectId(userId),
//     });

//     if (!portfolios.length) {
//       result.data = {
//         totalValue: 0,
//         totalChange24h: 0,
//         totalChange24hPct: 0,
//         assetsChart: [],
//       };
//       return result;
//     }

//     const portfolioIds = portfolios.map((p) => p._id);

//     // 2. Filter transactions
//     const filter = { portfolioId: { $in: portfolioIds } };

//     if (timeFilter) {
//       const startDate = new Date();
//       startDate.setDate(startDate.getDate() - Number(timeFilter));
//       filter.transactionTime = { $gte: startDate };
//     }

//     const transactions = await Transaction.find(filter);
//     if (!transactions.length) {
//       result.data = {
//         totalValue: 0,
//         totalChange24h: 0,
//         totalChange24hPct: 0,
//         assetsChart: [],
//       };
//       return result;
//     }

//     // 3. Aggregate per coin
//     const holdings = {};
//     const coinIds = new Set();

//     transactions.forEach((tx) => {
//       const coinId = tx.coinId;
//       coinIds.add(coinId);
//       let qty = holdings[coinId] || 0;
//       if (tx.type === "buy") qty += tx.quantity;
//       else if (tx.type === "sell") qty -= tx.quantity;
//       else if (tx.type === "transfer") {
//         if (tx.transferDirection === "in") qty += tx.quantity;
//         else if (tx.transferDirection === "out") qty -= tx.quantity;
//       }
//       holdings[coinId] = qty;
//     });

//     const coins = await Coin.find({ coinId: { $in: Array.from(coinIds) } });

//     // 4. Calculate total value + 24h change
//     let totalValue = 0;
//     let totalChange24h = 0;

//     coins.forEach((coin) => {
//       const qty = holdings[coin.coinId] || 0;
//       const value = qty * (coin.price || 0);
//       totalValue += value;
//       totalChange24h += value * ((coin.percent_change_24h || 0) / 100);
//     });

//     const totalChange24hPct =
//       totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

//     // 5. Build chart only for active transaction days
//     const assetsChart = [];
//     const groupedByDay = {};

//     for (const tx of transactions) {
//       const date = new Date(tx.transactionTime);
//       const dateKey = date.toISOString().split("T")[0];
//       if (!groupedByDay[dateKey]) groupedByDay[dateKey] = [];

//       groupedByDay[dateKey].push(tx);
//     }

//     const coinMap = {};
//     coins.forEach((c) => (coinMap[c.coinId] = c));

//     for (const [date, txs] of Object.entries(groupedByDay)) {
//       let dayValue = 0;
//       for (const tx of txs) {
//         const coin = coinMap[tx.coinId];
//         if (!coin) continue;

//         const qty = holdings[tx.coinId] || 0;
//         dayValue += qty * (coin.price || 0);
//       }

//       assetsChart.push({
//         date,
//         value: Number(dayValue.toFixed(2)),
//       });
//     }

//     // Sort chart by date ascending
//     assetsChart.sort((a, b) => new Date(a.date) - new Date(b.date));

//     result.data = {
//       totalValue: Number(totalValue.toFixed(2)),
//       totalChange24h: Number(totalChange24h.toFixed(2)),
//       totalChange24hPct: Number(totalChange24hPct.toFixed(2)),
//       assetsChart,
//     };
//   } catch (ex) {
//     console.error("[chart.service] Error:", ex.message);
//     result.ex = ex.message;
//   } finally {
//     return result;
//   }
// };
exports.chart = async (chartDto, result = {}) => {
  try {
    const { userId, timeFilter, portfolioId } = chartDto || {};

    if (!userId) {
      result.ex = "userId is required";
      return result;
    }

    // Resolve ObjectId
    let userOid;
    try {
      userOid = new mongoose.Types.ObjectId(userId);
    } catch {
      result.ex = "Invalid userId";
      return result;
    }

    // 1) Find single portfolio: requested -> isMe -> first
    let portfolio = null;
    if (portfolioId) {
      try {
        portfolio = await Portfolio.findOne({
          _id: new mongoose.Types.ObjectId(portfolioId),
          userId: userOid,
        });
      } catch (e) {
        // ignore and try fallbacks
      }
    }
    if (!portfolio)
      portfolio = await Portfolio.findOne({ userId: userOid, isMe: true });
    if (!portfolio) portfolio = await Portfolio.findOne({ userId: userOid });

    if (!portfolio) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 2) Load transactions for that single portfolio (optional time filter)
    const txFilter = { portfolioId: portfolio._id };
    if (timeFilter) {
      const start = new Date();
      start.setDate(start.getDate() - Number(timeFilter));
      txFilter.transactionTime = { $gte: start };
    }

    const transactions = await Transaction.find(txFilter).lean();
    if (!transactions || transactions.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 3) Compute holdings per coinId
    const holdings = {};
    for (const tx of transactions) {
      const cid = tx.coinId;
      if (!cid) continue;
      holdings[cid] = holdings[cid] || 0;

      if (tx.type === "buy") holdings[cid] += tx.quantity;
      else if (tx.type === "sell") holdings[cid] -= tx.quantity;
      else if (
        tx.type === "transfer" ||
        tx.type === "receive" ||
        tx.type === "send"
      ) {
        if (tx.transferDirection === "in") holdings[cid] += tx.quantity;
        else if (tx.transferDirection === "out") holdings[cid] -= tx.quantity;
      }
    }

    const coinIds = Object.keys(holdings);
    if (coinIds.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 4) Fetch coin prices and compute totals
    const coins = await Coin.find({ coinId: { $in: coinIds } }).lean();

    let totalValue = 0;
    let totalChange24h = 0;
    const assetsChart = [];

    for (const c of coins) {
      const qty = holdings[c.coinId] || 0;
      const price = Number(c.price || 0);
      const value = qty * price;
      const change24 = value * ((c.percent_change_24h || 0) / 100);

      totalValue += value;
      totalChange24h += change24;

      assetsChart.push({
        coinId: c.coinId,
        name: c.name,
        symbol: c.symbol,
        value: Number(value.toFixed(2)),
      });
    }

    const totalChange24hPct = totalValue
      ? (totalChange24h / totalValue) * 100
      : 0;

    result.data = {
      totalValue: Number(totalValue.toFixed(2)),
      totalChange24h: Number(totalChange24h.toFixed(2)),
      totalChange24hPct: Number(totalChange24hPct.toFixed(2)),
      assetsChart,
    };
  } catch (ex) {
    console.error("[chart.service] Error:", ex);
    result.ex = ex.message || ex;
  } finally {
    return result;
  }
};
exports.deleteAsset = async (statsDto, result = {}) => {
  try {
    const { userId, coinId, portfolioId } = statsDto;

    // Validate input
    if (!userId || !coinId || !portfolioId) {
      throw new Error("userId, coinId, and portfolioId are required.");
    }

    // Build the delete filter
    const filter = {
      userId,
      coinId,
      portfolioId,
    };

    // Delete matching transaction(s)
    const deleteResult = await Transaction.deleteMany(filter);

    if (deleteResult.deletedCount === 0) {
      result.data = {
        deletedCount: 0,
        message: "No matching assets found to delete.",
      };
    } else {
      result.data = {
        deletedCount: deleteResult.deletedCount,
        message: `${deleteResult.deletedCount} asset(s) deleted successfully.`,
      };
    }
  } catch (ex) {
    console.error("[chart.service] deleteAsset Error:", ex);
    result.ex = ex.message;
  } finally {
    return result;
  }
};

exports.update = async (updateDto, result = {}) => {
  try {
    const { id, userId, ...updateFields } = updateDto;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      result.ex = new Error("Invalid transaction ID");
      return result;
    }

    // Optional: ensure only the user's transaction can be updated
    const filter = { _id: id, userId };

    // Fetch transaction first to reapply calculations
    const existingTx = await Transaction.findOne(filter);
    if (!existingTx) {
      result.data = null;
      return result;
    }

    Object.assign(existingTx, updateFields);

    // Trigger `pre('validate')` again to recalc totals
    await existingTx.validate();
    const updated = await existingTx.save();

    result.data = updated;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.delete = async (deleteDto, result = {}) => {
  try {
    const { id, userId } = deleteDto;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      result.ex = new Error("Invalid transaction ID");
      return result;
    }

    // Ensure transaction belongs to the user
    const filter = { _id: id, userId };

    // Find the transaction first
    const existingTx = await Transaction.findOne(filter);
    if (!existingTx) {
      result.data = null;
      result.message = "Transaction not found";
      return result;
    }

    // Delete the transaction
    await Transaction.deleteOne({ _id: existingTx._id });

    // Return deleted data
    result.data = existingTx;
    result.message = "Transaction deleted successfully";
  } catch (ex) {
    console.error("[Transaction.delete] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.allAssetWithPortfolio = async (byUserIdDto, result = {}) => {
  try {
    const { portfolioId, offset, limit } = byUserIdDto;

    if (!portfolioId) {
      result.ex = new Error("Missing portfolioId");
      return result;
    }

    // 1. Get all transactions for the given portfolio
    const transactions = await Transaction.find({
      portfolioId: new mongoose.Types.ObjectId(portfolioId),
    }).lean();
    console.log(transactions, "transactions");
    if (!transactions.length) {
      result.data = [];
      result.message = "No transactions found for this portfolio";
      return result;
    }

    // 3. Fetch only those coins from the Coin collection
    const coinsData = await Coin.find({ coinId: { $in: coinIds } })

      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    // 4. Response
    result.data = coinsData;
    result.total = coinIds.length;
    result.message = "Unique coins fetched successfully from portfolio";
  } catch (ex) {
    console.error("[allAssetWithPortfolio] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
