const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

module.exports = {
  create: {
    body: Joi.object({
      // userId: Joi.string()
      //   .pattern(/^[0-9a-fA-F]{24}$/)
      //   .required(),

      coinId: Joi.string().trim().required(),
      portfolioId: Joi.objectId().required(),

      type: Joi.string().valid("buy", "sell", "transfer").required(),

      transferDirection: Joi.when("type", {
        is: "transfer",
        then: Joi.string().valid("in", "out").required(),
        otherwise: Joi.any().strip(),
      }),

      transactionTime: Joi.date().default(Date.now),

      note: Joi.string().allow("").max(500),

      quantity: Joi.number().positive().required(),

      fee: Joi.number().min(0).default(0),

      pricePerCoin: Joi.when("type", {
        is: Joi.valid("buy", "sell"),
        then: Joi.number().positive().required(),
        otherwise: Joi.number().default(0),
      }),

      totalSpent: Joi.when("type", {
        is: "buy",
        then: Joi.number().min(0),
        otherwise: Joi.number().default(0),
      }),

      totalReceived: Joi.when("type", {
        is: "sell",
        then: Joi.number().min(0),
        otherwise: Joi.number().default(0),
      }),
    }).custom((value, helpers) => {
      if (value.type === "buy") {
        value.totalSpent =
          value.quantity * value.pricePerCoin + (value.fee || 0);
        value.totalReceived = 0;
      }
      if (value.type === "sell") {
        value.totalReceived =
          value.quantity * value.pricePerCoin - (value.fee || 0);
        value.totalSpent = 0;
      }
      if (value.type === "transfer") {
        value.pricePerCoin = 0;
        value.totalSpent = 0;
        value.totalReceived = 0;
      }
      return value;
    }),
  },
  allAsset: {
    query: Joi.object({
      offset: Joi.number().integer().required(),
      limit: Joi.number().integer().required(),
    }),
  },
  allAssetWithPortfolio: {
    query: Joi.object({
      offset: Joi.number().integer().required(),
      limit: Joi.number().integer().required(),
      portfolioId: Joi.objectId().required(),
    }),
  },
  stats: {
    query: Joi.object({
      timeFilter: Joi.number().integer().valid(1, 7, 30, 90).optional(),
    }),
  },
  deleteAsset: {
    query: Joi.object({
      coinId: Joi.string().trim().required(),
      portfolioId: Joi.objectId().required(),
    }),
  },
  update: {
    body: Joi.object({
      type: Joi.string().valid("buy", "sell", "transfer").optional(),
      transferDirection: Joi.string().valid("in", "out").optional(),
      transactionTime: Joi.date().optional(),
      note: Joi.string().allow("").optional(),
      quantity: Joi.number().positive().optional(),
      fee: Joi.number().min(0).optional(),
      pricePerCoin: Joi.number().min(0).optional(),
    }),
  },
};
