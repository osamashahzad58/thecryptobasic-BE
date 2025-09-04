const Joi = require("joi");

module.exports.join_room = Joi.object({
  get: Joi.object({
    limit: Joi.number().positive().required(),
    offset: Joi.number().required(),
  }),
});
