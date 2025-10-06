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

    // 1. Get user portfolios
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

    // 3. Get all coin data
    const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];
    const coins = await Coin.find({ coinId: { $in: coinIds } });

    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.coinId] = coin;
    }

    // 4. Group transactions and compute total value
    const portfolioHoldings = {}; // { portfolioId: { coinId: qty } }

    for (const tx of transactions) {
      const pid = tx.portfolioId.toString();
      if (!portfolioHoldings[pid]) portfolioHoldings[pid] = {};
      const coinId = tx.coinId;
      const prevQty = portfolioHoldings[pid][coinId] || 0;

      if (tx.type === "buy") {
        portfolioHoldings[pid][coinId] = prevQty + tx.quantity;
      } else if (tx.type === "sell") {
        portfolioHoldings[pid][coinId] = prevQty - tx.quantity;
      } else if (tx.type === "transfer") {
        if (tx.transferDirection === "in") {
          portfolioHoldings[pid][coinId] = prevQty + tx.quantity;
        } else if (tx.transferDirection === "out") {
          portfolioHoldings[pid][coinId] = prevQty - tx.quantity;
        }
      }
    }

    // 5. Build clean data
    const data = portfolios.map((portfolio) => {
      const pid = portfolio._id.toString();
      const holdings = portfolioHoldings[pid] || {};
      let totalValue = 0;
      const coinsList = [];

      for (const [coinId, qty] of Object.entries(holdings)) {
        const coin = coinMap[coinId];
        if (coin && coin.price && qty > 0) {
          const value = qty * coin.price;
          totalValue += value;
          coinsList.push({
            coinId,
            logo: coin.logo || null,
            price: Number(coin.price),
          });
        }
      }

      return {
        name: portfolio.name,
        totalValue: Number(totalValue.toFixed(2)),
        coins: coinsList,
      };
    });

    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
