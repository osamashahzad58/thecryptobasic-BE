const Joi = require("joi");

module.exports = {
  create: {
    body: Joi.object({
      userId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),

      coinId: Joi.string().trim().required(),

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
};
