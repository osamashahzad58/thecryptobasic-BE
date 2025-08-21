const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

module.exports = {
  createCode: {
    body: Joi.object({
      email: Joi.string().required(),
    }),
  },
};
