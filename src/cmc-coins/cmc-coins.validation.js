const Joi = require("joi");
const {
  TIME_INTERVALS,
  TIME_PERIOD,
} = require("./constants/cmc-coins.enum.constant");
const { search } = require("./cmc-coins.router");
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
  getCompare: {
    query: Joi.object({
      tokenA: Joi.string().required(),
      tokenB: Joi.string().required(),
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
  AllCrypto: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      search: Joi.string().optional(),
      offset: Joi.number().positive().required(),
      orderField: Joi.string().valid("price"),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  skipCoinId: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      skipCoinId: Joi.string().required(), // coinId to skip
      search: Joi.string().optional(),
      offset: Joi.number().positive().required(),
      orderField: Joi.string().valid("price", "createdAt"),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
};
