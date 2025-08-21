const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

module.exports = {
  idInParams: {
    params: Joi.object({
      id: Joi.objectId().required(),
    }),
  },
};
