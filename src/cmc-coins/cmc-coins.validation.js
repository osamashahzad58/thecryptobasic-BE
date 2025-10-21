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

  getConverter: {
    query: Joi.object({
      tokenA: Joi.string().required(),
      tokenB: Joi.string().required(),
    }),
  },
  getCompare: {
    query: Joi.object({
      coinIds: Joi.alternatives()
        .try(
          Joi.array().items(Joi.string().trim().min(1)).min(1),
          Joi.string()
            .trim()
            .pattern(/^[^,]+(,[^,]+)*$/) // comma-separated list of coinIds
        )
        .required()
        .messages({
          "any.required": "coinIds field is required",
          "string.pattern.base":
            "coinIds must be comma-separated or an array of strings",
          "array.min": "Provide at least one coinId",
        }),
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
  getSlug: {
    query: Joi.object({
      slug: Joi.string().trim().required(),
    }),
  },
  AllCrypto: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      userId: Joi.string().trim().optional(),
      search: Joi.string().optional(),
      offset: Joi.number().positive().required(),
      orderField: Joi.string().valid("price", "cmcRank"),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  skipCoinId: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      userId: Joi.string().trim().optional(),
      slug: Joi.string().required(), // coinId to skip
      search: Joi.string().optional(),
      offset: Joi.number().positive().required(),
      orderField: Joi.string().valid("price", "createdAt"),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  getAltCoin: {
    query: Joi.object({
      start: Joi.string().trim().optional(),
      end: Joi.string().trim().optional(), // coinId to skip
    }),
  },
};
