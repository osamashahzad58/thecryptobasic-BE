const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

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
  getByStatus: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      offset: Joi.number().required(),
      status: Joi.string().valid("pending", "completed", "answered").required(),
      questionType: Joi.string()
        .valid("data_request", "survey", "external_resource", "dispute")
        .required(),
      isVoted: Joi.boolean().optional(),
      search: Joi.string().trim().optional(),
      title: Joi.string().trim().optional(),
      question: Joi.string().trim().optional(),
      orderField: Joi.string()
        .valid(
          "email",
          "createdAt",
          "updatedAt",
          "start_Date_UTC",
          "_id",
          "questionInstance_totalRewardAmount",
          "title",
          "question",
          "blockNumber",
          "dealSize",
          "limit",
          "questionInstance_rewardPerOracle",
          "end_Date_UTC"
        )
        .required(),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  myRewards: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      offset: Joi.number().positive().required(),
      questionType: Joi.string()
        .valid("data_request", "survey", "external_resource", "dispute")
        .required(),
      search: Joi.string().trim().optional(),
      isClaim: Joi.boolean().optional(),
      title: Joi.string().trim().optional(),
      question: Joi.string().trim().optional(),
      orderField: Joi.string()
        .valid(
          "email",
          "createdAt",
          "updatedAt",
          "start_Date_UTC",
          "_id",
          "questionInstance_totalRewardAmount",
          "title",
          "question",
          "blockNumber",
          "dealSize",
          "limit",
          "questionInstance_rewardPerOracle",
          "end_Date_UTC"
        )
        .required(),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  getQuestionByCreator: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      offset: Joi.number().positive().required(),
      // status: Joi.string().valid("pending", "completed", "answered").required(),
      questionType: Joi.string()
        .valid("data_request", "survey", "external_resource", "dispute")
        .required(),
      isVoted: Joi.boolean().optional(),
      search: Joi.string().trim().optional(),
      title: Joi.string().trim().optional(),
      question: Joi.string().trim().optional(),
      orderField: Joi.string()
        .valid(
          "email",
          "createdAt",
          "updatedAt",
          "start_Date_UTC",
          "_id",
          "questionInstance_totalRewardAmount",
          "title",
          "question",
          "blockNumber",
          "dealSize",
          "limit",
          "questionInstance_rewardPerOracle"
        )
        .required(),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  getCountry: {
    query: Joi.object({
      nationality: Joi.string().required(),
    }),
  },
  getGender: {
    query: Joi.object({
      gender: Joi.string().required(),
    }),
  },
  byAddress: {
    query: Joi.object({
      walletAddress: Joi.string().required(),
    }),
  },
  getAge: {
    query: Joi.object({
      age: Joi.string()
        .valid(
          "20-25",
          "25-30",
          "30-35",
          "35-40",
          "40-45",
          "45-50",
          "50-55",
          "55-60",
          "60+"
        )
        .required()
        .messages({
          "any.only":
            "Invalid age group. Allowed values: '20-25', '25-30', '30-35', etc.",
          "any.required": "Age group is required.",
        }),
    }),
  },
  demographics: {
    query: Joi.object({
      nationality: Joi.array()
        .items(Joi.string().allow("")) // allows empty string inside
        .optional(), // allows the field to be missing

      gender: Joi.array().items(Joi.string().allow("")).optional(),

      age: Joi.array()
        .items(
          Joi.string()
            .valid(
              "20-25",
              "25-30",
              "30-35",
              "35-40",
              "40-45",
              "45-50",
              "50-55",
              "55-60",
              "60+"
            )
            .allow("") // allows empty string inside array
        )
        .optional()
        .messages({
          "any.only":
            "Invalid age group. Allowed values: '20-25', '25-30', '30-35', etc.",
        }),
    }),
  },
  getByQuestion: {
    query: Joi.object({
      limit: Joi.number().positive().required(),
      offset: Joi.number().positive().required(),
      questionType: Joi.string()
        .valid("data_request", "survey", "external_resource", "dispute")
        .required(),
      isVoted: Joi.boolean().optional(),
      search: Joi.string().trim().optional(),
      orderField: Joi.string().valid("email", "price", "updatedAt"),
      orderDirection: Joi.number().integer().valid(1, -1).when("orderField", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
    }),
  },
  verifyOtp: {
    body: Joi.object({
      otp: Joi.string().trim().required(),
    }),
  },
  sendOtp: {
    body: Joi.object({
      email: Joi.string().trim().email().required(),
    }),
  },
};
