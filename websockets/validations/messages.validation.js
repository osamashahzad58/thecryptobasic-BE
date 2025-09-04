const Joi = require("joi");

module.exports.join_room = Joi.object({
  get: Joi.object({
    limit: Joi.number().positive().required(),
    offset: Joi.number().required(),
  }),
});
module.exports.join_room_byId = Joi.object({
  get: Joi.object({
    coinId: Joi.number().positive().required(),
  }),
});
