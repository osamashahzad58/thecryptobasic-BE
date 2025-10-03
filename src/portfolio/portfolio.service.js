let Portfolio = require("./portfolio.model");
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
