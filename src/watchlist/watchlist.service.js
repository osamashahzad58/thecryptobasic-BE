let Watchlist = require("./watchlist.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

exports.create = async (createDto, result = {}) => {
  try {
    const data = await Watchlist.create(createDto);
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
exports.byUserId = async (byUserIdDto, result = {}) => {
  try {
    const { userId } = byUserIdDto;

    const data = await Watchlist.find({
      userId: mongoose.Types.ObjectId(userId),
    });
    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
