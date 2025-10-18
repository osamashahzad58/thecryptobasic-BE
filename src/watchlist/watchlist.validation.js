const Joi = require("joi");

module.exports = {
  toggleMultiple: {
    body: Joi.object({
      coinIds: Joi.array()
        .items(Joi.string().trim().required())
        .min(1)
        .required()
        .messages({
          "array.base": `"coinIds" must be an array`,
          "array.min": `"coinIds" must contain at least one coin ID`,
          "any.required": `"coinIds" is required`,
        }),
    }),
  },
};
