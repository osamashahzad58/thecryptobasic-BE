let Transaction = require("./transaction.controller");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

exports.create = async (createDto, result = {}) => {
  try {
    const data = await Transaction.create(createDto);
    result.data = data;
  } catch (ex) {
    result.ex = ex;
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
