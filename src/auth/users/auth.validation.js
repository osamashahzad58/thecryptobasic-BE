const Joi = require("joi");
const { StatusCodes } = require("http-status-codes");
const { joiPasswordExtendCore } = require("joi-password");
const joiPassword = Joi.extend(joiPasswordExtendCore);
const configs = require("../../../configs");

module.exports = {
  signin: {
    body: Joi.object({
      email: Joi.string().email().trim(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().required(),
    }),
  },
  signup: {
    body: Joi.object({
      email: Joi.string().email().trim().required(),
      userName: Joi.string().required(),
      password: Joi.string().required(),
    }),
  },
  register: {
    body: Joi.object({
      // name: Joi.string().max(128),
      walletAddress: Joi.string().trim().length(42).required(),
    }),
  },

  login: {
    body: Joi.object({
      walletAddress: Joi.string().trim().length(42).required().lowercase(),
      sign: Joi.string().trim().base64().required().lowercase(),
    }),
  },
  generateNewAccessToken: {
    body: Joi.object({
      refreshToken: Joi.string().trim().required(),
    }),
  },
  forgetPassword: {
    body: Joi.object({
      email: Joi.string().trim().lowercase().email().required(),
    }),
  },
  verify_Email: {
    body: Joi.object({
      email: Joi.string().trim().lowercase().email().required(),
      walletAddress: Joi.string().trim().length(42).required(),
      otpCode: Joi.number().integer().positive().required(),
      isEmailVerified: Joi.boolean(),
    }),
  },
  validateTokenVerificationPayload: function (req, res, next) {
    try {
      const schema = Joi.object({
        token: Joi.string().trim().required(),
      });
      const { error } = schema.validate(req.query);

      if (error) {
        console.log(req.query);
        return res.status(StatusCodes.BAD_REQUEST).render("pages/bad-request", {
          title: "Bad Request",
          reason: error.details[0].message,
        });
      }
      next();
    } catch (ex) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .render("pages/users/server-error", {
          title: "Internal Server Error",
        });
    }
  },
  updatePassword: {
    body: Joi.object({
      token: Joi.string().trim().required(),
      password: joiPassword
        .string()
        .minOfSpecialCharacters(
          configs.passwordPolicy && configs.passwordPolicy.minSpecialChars
        )
        .minOfLowercase(
          configs.passwordPolicy && configs.passwordPolicy.minLowercase
        )
        .minOfUppercase(
          configs.passwordPolicy && configs.passwordPolicy.minUppercase
        )
        .minOfNumeric(
          configs.passwordPolicy && configs.passwordPolicy.minNumeric
        )
        .noWhiteSpaces()
        .min(configs.passwordPolicy && configs.passwordPolicy.minLength)
        .messages({
          "password.minOfUppercase":
            "{#label} should contain at least {#min} uppercase character",
          "password.minOfSpecialCharacters":
            "{#label} should contain at least {#min} special character",
          "password.minOfLowercase":
            "{#label} should contain at least {#min} lowercase character",
          "password.minOfNumeric":
            "{#label} should contain at least {#min} numeric character",
          "password.noWhiteSpaces": "{#label} should not contain white spaces",
        }),
      confirmPassword: Joi.string()
        .required()
        .valid(Joi.ref("password"))
        .messages({
          "any.only": "{{#label}} does not match the password field",
        }),
    }),
  },
};
