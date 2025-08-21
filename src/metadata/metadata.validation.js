const Joi = require("joi");

module.exports = {
  getImageUrl: {
    body: Joi.object({
      imageUrl: Joi.string().uri().required()
    })
  }
};
