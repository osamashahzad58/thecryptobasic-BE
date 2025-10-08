let Portfolio = require("./portfolio.model");
let Transaction = require("../transaction/transaction.model");
let Coin = require("../cmc-coins/models/cmc-coins.model");
const mongoose = require("mongoose");

exports.create = async (createDto, result = {}) => {
  try {
    const data = await Portfolio.create(createDto);
    result.data = data;
  } catch (ex) {
    if (ex.code === 11000) {
      result.ex = {
        message: "This coin is already in the user's watchlist.",
        code: 11000,
      };
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};
// exports.getList = async (getListDto, result = {}) => {
//   try {
//     const { userId } = getListDto;

//     const data = await Portfolio.find({
//       userId: mongoose.Types.ObjectId(userId),
//     });
//     result.data = data;
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };

exports.getList = async (getListDto, result = {}) => {
  try {
    const { userId } = getListDto;

    // 1. Get all portfolios for the user
    const portfolios = await Portfolio.find({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!portfolios.length) {
      result.data = [];
      return result;
    }

    // 2. Get all transactions for those portfolios
    const portfolioIds = portfolios.map((p) => p._id);
    const transactions = await Transaction.find({
      portfolioId: { $in: portfolioIds },
    });

    // 3. Get all unique coinIds used
    const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];
    const coins = await Coin.find({ coinId: { $in: coinIds } });

    // Create lookup map for coin info
    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.coinId] = coin;
    }

    // 4. Group transactions by portfolioId and compute holdings
    const transactionsByPortfolio = {};
    const portfolioHoldings = {}; // { portfolioId: { coinId: quantity } }

    for (const tx of transactions) {
      const pid = tx.portfolioId.toString();
      if (!transactionsByPortfolio[pid]) transactionsByPortfolio[pid] = [];
      if (!portfolioHoldings[pid]) portfolioHoldings[pid] = {};

      const coinInfo = coinMap[tx.coinId] || {};
      const coinId = tx.coinId;

      // Attach coin info to transaction
      transactionsByPortfolio[pid].push({
        ...tx.toObject(),
        coinInfo: {
          coinId: coinInfo.coinId || tx.coinId,
          logo: coinInfo.logo || null,
          price: coinInfo.price || 0, // assuming your Coin model has a price field
          market_cap: coinInfo.market_cap || 0, // assuming your Coin model has a price field
          percent_change_7d: coinInfo.percent_change_7d || 0, // assuming your Coin model has a price field
          percent_change_24h: coinInfo.percent_change_24h || 0, // assuming your Coin model has a price field
          percent_change_1h: coinInfo.percent_change_1h || 0, // assuming your Coin model has a price field
          volume_change_24h: coinInfo.volume_change_24h || 0, // assuming your Coin model has a price field
        },
      });

      // Compute current holdings
      const quantity = portfolioHoldings[pid][coinId] || 0;

      if (tx.type === "buy") {
        portfolioHoldings[pid][coinId] = quantity + tx.quantity;
      } else if (tx.type === "sell") {
        portfolioHoldings[pid][coinId] = quantity - tx.quantity;
      } else if (tx.type === "transfer") {
        if (tx.transferDirection === "in") {
          portfolioHoldings[pid][coinId] = quantity + tx.quantity;
        } else if (tx.transferDirection === "out") {
          portfolioHoldings[pid][coinId] = quantity - tx.quantity;
        }
      }
    }

    // 5. Compute total value for each portfolio
    const data = portfolios.map((portfolio) => {
      const pid = portfolio._id.toString();
      const holdings = portfolioHoldings[pid] || {};
      let totalValue = 0;

      for (const [coinId, qty] of Object.entries(holdings)) {
        const coin = coinMap[coinId];
        if (coin && coin.price && qty > 0) {
          totalValue += qty * coin.price;
        }
      }

      return {
        ...portfolio.toObject(),
        totalValue,
        transactions: transactionsByPortfolio[pid] || [],
      };
    });

    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.update = async (updateDto, result = {}) => {
  try {
    const { portfolioId, userId, ...updateFields } = updateDto;

    if (!portfolioId) {
      result.ex = new Error("portfolioId is required");
      return result;
    }

    // Make sure the user can only update their own portfolio
    const filter = { _id: portfolioId };
    if (userId) filter.userId = userId;

    const updated = await Portfolio.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true }
    );

    result.data = updated;
  } catch (ex) {
    if (ex.code === 11000) {
      result.ex = {
        message: "Duplicate key error. Portfolio already exists.",
        code: 11000,
      };
    } else {
      result.ex = ex;
    }
  } finally {
    return result;
  }
};
exports.getByPortfolioId = async (getDto, result = {}) => {
  try {
    const { portfolioId } = getDto;
    console.log(portfolioId, "portfolioId");

    if (!portfolioId) {
      result.ex = new Error("portfolioId is required");
      return result;
    }

    // 1. Find the portfolio
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      result.ex = new Error("Portfolio not found");
      return result;
    }
    console.log(portfolio, "portfolio");

    // 2. Find all transactions for this portfolio
    const transactions = await Transaction.find({
      portfolioId: new mongoose.Types.ObjectId(portfolioId),
    });
    console.log(transactions, "transactions");
    // 3. Extract unique coinIds
    const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];
    const coins = await Coin.find({ coinId: { $in: coinIds } });

    // Create a quick lookup for coins
    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.coinId] = coin;
    }

    // 4. Compute holdings and attach coin info
    const holdings = {};
    const enrichedTransactions = [];

    for (const tx of transactions) {
      const coinInfo = coinMap[tx.coinId] || {};
      const coinId = tx.coinId;

      // Attach coin details to each transaction
      enrichedTransactions.push({
        ...tx.toObject(),
        coinInfo: {
          coinId: coinInfo.coinId || tx.coinId,
          logo: coinInfo.logo || null,
          price: coinInfo.price || 0,
          market_cap: coinInfo.market_cap || 0,
          percent_change_7d: coinInfo.percent_change_7d || 0,
          percent_change_24h: coinInfo.percent_change_24h || 0,
          percent_change_1h: coinInfo.percent_change_1h || 0,
          volume_change_24h: coinInfo.volume_change_24h || 0,
        },
      });

      // Update holdings
      const currentQty = holdings[coinId] || 0;

      if (tx.type === "buy") {
        holdings[coinId] = currentQty + tx.quantity;
      } else if (tx.type === "sell") {
        holdings[coinId] = currentQty - tx.quantity;
      } else if (tx.type === "transfer") {
        if (tx.transferDirection === "in") {
          holdings[coinId] = currentQty + tx.quantity;
        } else if (tx.transferDirection === "out") {
          holdings[coinId] = currentQty - tx.quantity;
        }
      }
    }

    // 5. Calculate total portfolio value
    let totalValue = 0;
    for (const [coinId, qty] of Object.entries(holdings)) {
      const coin = coinMap[coinId];
      if (coin && coin.price && qty > 0) {
        totalValue += qty * coin.price;
      }
    }

    // 6. Prepare final response
    result.data = {
      ...portfolio.toObject(),
      totalValue,
      transactions: enrichedTransactions,
    };
    result.message = "Portfolio details fetched successfully";
  } catch (ex) {
    console.error("[Portfolio.getByPortfolioId] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.stats = async (statsDto, result = {}) => {
  try {
    const { _id, timeFilter } = statsDto;

    if (!_id) {
      result.ex = new Error("Portfolio ID (_id) is required");
      return result;
    }

    // 1. Fetch the portfolio
    const portfolio = await Portfolio.findById(_id);
    if (!portfolio) {
      result.data = getEmptyStats();
      result.message = "Portfolio not found";
      return result;
    }

    // 2. Build transaction filter
    const filter = { portfolioId: new mongoose.Types.ObjectId(_id) };

    if (timeFilter) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(timeFilter));
      filter.transactionTime = { $gte: startDate };
    }

    // 3. Fetch transactions for this portfolio
    const transactions = await Transaction.find(filter);
    if (!transactions.length) {
      result.data = getEmptyStats();
      result.message = "No transactions found";
      return result;
    }

    // 4. Calculate holdings from transactions
    const holdings = {};
    const coinIds = new Set();

    for (const tx of transactions) {
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
    }

    // 5. Fetch coin details
    const coins = await Coin.find({ coinId: { $in: Array.from(coinIds) } });

    // 6. Calculate portfolio statistics
    let totalValue = 0;
    let totalChange24h = 0;
    const distribution = [];

    for (const coin of coins) {
      const qty = holdings[coin.coinId] || 0;
      const price = parseFloat(coin.price) || 0;
      const value = qty * price;

      totalValue += value;
      totalChange24h +=
        value * ((parseFloat(coin.percent_change_24h) || 0) / 100);

      distribution.push({
        coinId: coin.coinId,
        name: coin.name,
        symbol: coin.symbol,
        logo: coin.logo,
        qty,
        price,
        value,
        pct: 0,
        percent_change_24h: parseFloat(coin.percent_change_24h) || 0,
      });
    }

    // 7. Calculate percent of each coin in the portfolio
    distribution.forEach((d) => {
      d.pct = totalValue ? ((d.value / totalValue) * 100).toFixed(2) : 0;
    });

    // 8. Sort top coins
    const topCoins = [...distribution]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 9. Mock chart data (you can later replace this with historical chart data)
    const days = timeFilter || 7;
    const assetsChart = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      assetsChart.push({
        date: date.toISOString().split("T")[0],
        value: totalValue,
      });
    }

    // 10. Diversification metric (Herfindahl-Hirschman Index)
    const hhi = distribution.reduce(
      (acc, d) => acc + Math.pow(Number(d.pct), 2),
      0
    );
    const diversimeter = {
      hhi,
      level: hhi < 1500 ? "Low Risk" : hhi < 3000 ? "Medium Risk" : "High Risk",
    };

    // 11. Portfolio health score (simple heuristic)
    const portfolioHealth = {
      score: Math.min(100, Math.round(totalValue / 1000)),
      label:
        totalValue < 50000 ? "Low" : totalValue < 100000 ? "Neutral" : "Good",
    };

    // 12. Percentage change in total value (24h)
    const totalChange24hPct =
      totalValue > 0
        ? ((totalChange24h / (totalValue - totalChange24h)) * 100).toFixed(2)
        : 0;

    // 13. Final response
    result.data = {
      totalValue,
      totalChange24h,
      totalChange24hPct: Number(totalChange24hPct),
      distribution,
      topCoins,
      assetsChart,
      diversimeter,
      portfolioHealth,
    };

    result.message = "Portfolio stats fetched successfully";
  } catch (ex) {
    console.error("[Portfolio.stats] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

// Helper: Empty default response
function getEmptyStats() {
  return {
    totalValue: 0,
    totalChange24h: 0,
    totalChange24hPct: 0,
    distribution: [],
    topCoins: [],
    assetsChart: [],
    diversimeter: { hhi: 0, level: "None" },
    portfolioHealth: { score: 0, label: "None" },
  };
}
