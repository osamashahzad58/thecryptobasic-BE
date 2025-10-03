let Transaction = require("./transaction.model");
let Portfolio = require("../portfolio/portfolio.model");
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

exports.byUserId = async (byUserIdDto, result = {}) => {
  try {
    const { userId } = byUserIdDto;

    const data = await Transaction.find({
      userId: mongoose.Types.ObjectId(userId),
    });
    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
