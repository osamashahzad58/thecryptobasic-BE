const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

module.exports = {
  create: {
    body: Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().allow(null, "").optional(),
    }),
  },
  stats: {
    query: Joi.object({
      timeFilter: Joi.number().integer().valid(1, 7, 30, 90).optional(),
      portfolioId: Joi.objectId().required(),
    }),
  },
};
