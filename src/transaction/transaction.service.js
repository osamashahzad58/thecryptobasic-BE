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
    const { userId } = byUserIdDto;

    // 1. Get all transactions for this user
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!transactions.length) {
      result.data = [];
      return result;
    }

    // 2. Get unique coinIds from transactions
    const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];

    // 3. Get all coin data from your CMC collection
    const coins = await Coin.find({ coinId: { $in: coinIds } });

    // 4. Create a lookup map for quick access
    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.coinId] = coin;
    }

    // 5. Attach coin details to each transaction
    const data = transactions.map((tx) => {
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

        // Add clean coin data
        coinInfo: {
          coinId: coinInfo.coinId || tx.coinId,
          logo: coinInfo.logo || null,
          price: Number(coinInfo.price || 0),
          market_cap: Number(coinInfo.market_cap || 0),
          percent_change_1h: Number(coinInfo.percent_change_1h || 0),
          percent_change_24h: Number(coinInfo.percent_change_24h || 0),
          percent_change_7d: Number(coinInfo.percent_change_7d || 0),
          volume_change_24h: Number(coinInfo.volume_change_24h || 0),
        },
      };
    });

    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
