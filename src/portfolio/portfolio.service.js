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
