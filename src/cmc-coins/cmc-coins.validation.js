const Joi = require("joi");
const {
  TIME_INTERVALS,
  TIME_PERIOD,
} = require("./constants/cmc-coins.enum.constant");
module.exports = {
  getPriceChart: {
    query: Joi.object({
      id: Joi.string().trim().required(),
      count: Joi.number().required(),
      interval: Joi.string()
        .trim()
        .valid(...Object.values(TIME_INTERVALS)),
    }),
  },
  getMarketPairs: {
    query: Joi.object({
      id: Joi.string().trim().required(),
      offset: Joi.number().integer().required(),
      limit: Joi.number().integer().required(),
    }),
  },
  address: {
    query: Joi.object({
      address: Joi.string().trim().required(),
    }),
  },
  getPricePerformanceStats: {
    query: Joi.object({
      id: Joi.string().trim().required(),
    }),
  },
  getStatsHighLow: {
    query: Joi.object({
      id: Joi.string().trim().required(),
      time_period: Joi.string()
        .trim()
        .valid(...Object.values(TIME_PERIOD)),
    }),
  },
  getById: {
    query: Joi.object({
      id: Joi.string().trim().required(),
    }),
  },
};
