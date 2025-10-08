const Joi = require("joi");

module.exports = {
  create: {
    body: Joi.object({
      name: Joi.string().required(),
      url: Joi.string().uri().allow(null, "").optional(),
    }),
  },
};
