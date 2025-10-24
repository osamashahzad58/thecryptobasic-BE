const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { joiPasswordExtendCore } = require("joi-password");
const joiPassword = Joi.extend(joiPasswordExtendCore);
const configs = require("../../configs");

module.exports = {
  profile: {
    body: Joi.object({
      name: Joi.string().trim().max(128),
      bio: Joi.string().trim(),
      twitterUserName: Joi.string().trim().max(128),
      instagramLink: Joi.string().trim().max(128),
      telegramLink: Joi.string().trim().max(128),
      websiteLink: Joi.string().trim().max(128),
      discordLink: Joi.string().trim().max(128),
      mediumLink: Joi.string().trim().max(128),
      email: Joi.string().email().trim(),
      redditLink: Joi.string().max(128).trim(),
    }),
  },
  fcmToken: {
    body: Joi.object({
      fcmToken: Joi.string().trim().required(),
    }),
  },
  mongoDBIdInParams: {
    params: Joi.object({
      id: Joi.objectId().required(),
    }),
  },
  verifyOtp: {
    body: Joi.object({
      otp: Joi.string().trim().required(),
    }),
  },
  restPassword: {
    body: Joi.object({
      email: Joi.string().trim().email().required(),
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
  sendOtp: {
    body: Joi.object({
      email: Joi.string().trim().email().required(),
    }),
  },
};
