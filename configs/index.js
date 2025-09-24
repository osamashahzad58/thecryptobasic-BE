module.exports = {
  database: {
    uri: process.env.DATABASE_URI,
  },
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      ttl: "7d",
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      ttl: "7 days",
      remeberMeTTL: "30 days",
      redisTTL: 7 * 86400, // 7 days
      redisRemeberMeTTL: 30 * 86400, //days
    },
    emailVerificationToken: {
      secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      ttl: 1800,
    },
    passwordResetToken: {
      secret: process.env.JWT_PASSWORD_RESET_TOKEN_SECRET,
      ttl: 1800,
    },
    issuer: "theCryptoBasic.com",
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  referralCode: {
    count: 1,
    length: 10,
  },
  privateKey: process.env.PRIVATE_KEY,
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY,
    accessSecret: process.env.AWS_ACCESS_SECRET,
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      bucketRegion: process.env.AWS_S3_BUCKET_REGION,
      bucketBaseUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_BUCKET_REGION}.amazonaws.com/`,
    },
  },
  websockets: {
    authTimeoutInMilliSec: 10000,
  },
  elasticEmail: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_EMAIL_SENDER,
    senderName: process.env.SENDGRID_EMAIL_SENDER_NAME,
    adminEmailAddress: process.env.SENDGRID_WIZARD_ADMIN_EMAIL_ADDRESS,
    aboutUsEmailTemplateId: process.env.SENDGRID_WIZARD_ABOUT_US_TEMPLATE_ID,
    passwordResetEmailTemplateId:
      process.env.SENDGRID_WIZARD_PASSWORD_RESET_TEMPLATE_ID,
    passwordVerifyEmailTemplateId:
      process.env.SENDGRID_VERIFICATION_EMAIL_TEMPLATE_ID,
    nftEmailTemplateId: process.env.SENDGRID_WIZARD_NFT_TEMPLATE_ID,
    welcome: process.env.SENDGRID_EARLY_USER_TEMPLATE_ID,
    sendOtp: process.env.SENDGRID_VERIFICATION_EMAIL_TEMPLATE_ID,
  },

  //   SENDGRID_API_KEY=703B5E4673250796633E66855D9F5097B8BE46912611D97E5E0F06AFD9D5CF6A01131B14BC49905FDC3EC14E87380E75
  // SENDGRID_API_KEY_NAME=TheCryptoBasic
  // SENDGRID_EMAIL_SENDER=support@thecryptobasic.com
  // SENDGRID_EMAIL_SENDER_NAME="TheCryptoBasic"
  // SENDGRID_EARLY_USER_TEMPLATE_ID=d-ff3af9e65d2a44c2b516e6d79e1e7c6d
  // SENDGRID_VERIFICATION_EMAIL_TEMPLATE_ID=sendOtp

  googleCloud: {
    firebase: {
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      notificationTTL: 60 * 60 * 24,
      batchLimit: 2, //same as firebase limit
    },
  },
  coinMarketCap: {
    apiKey: process.env.CMC_API_KEY,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    sender: process.env.SENDGRID_EMAIL_SENDER,
    senderName: process.env.SENDGRID_EMAIL_SENDER_NAME,
    adminEmailAddress: process.env.SENDGRID_WIZARD_ADMIN_EMAIL_ADDRESS,
    aboutUsEmailTemplateId: process.env.SENDGRID_WIZARD_ABOUT_US_TEMPLATE_ID,
    passwordResetEmailTemplateId:
      process.env.SENDGRID_WIZARD_PASSWORD_RESET_TEMPLATE_ID,
    passwordVerifyEmailTemplateId: process.env.SENDGRID_WIZARD_VERIFY_EMAIL,
    nftEmailTemplateId: process.env.SENDGRID_WIZARD_NFT_TEMPLATE_ID,
    welcome: process.env.SENDGRID_EARLY_USER_TEMPLATE_ID,
    completed: process.env.SENDGRID_COMPLETED_TEMPLATE_ID,
    verificationEmailTemplateId:
      process.env.SENDGRID_VERIFICATION_EMAIL_TEMPLATE_ID,
    dataRequestTemplateId: process.env.SENDGRID_DATA_REQUEST_TEMPLATE_ID,
    disputeTemplateId: process.env.SENDGRID_DISPUTE_TEMPLATE_ID,
    disputeWinTemplateId: process.env.SENDGRID_DISPUTE_WIN_TEMPLATE_ID,
    disputeLossTemplateId: process.env.SENDGRID_DISPUTE_LOSS_TEMPLATE_ID,
    disputeAskerWinTemplateId:
      process.env.SENDGRID_DISPUTE_ASKER_WINNER_TEMPLATE_ID,
    disputeAskerLossTemplateId:
      process.env.SENDGRID_DISPUTE_ASKER_LOSS_TEMPLATE_ID,
    surveysTemplateId: process.env.SENDGRID_SURVEY_TEMPLATE_ID,
    kycCompletedTemplateId: process.env.SENDGRID_KYC_COMPLETED_TEMPLATE_ID,
    jurySelectedTemplateId: process.env.SENDGRID_DISPUTE_JURY_TEMPLATE_ID,
  },
  passwordPolicy: {
    minLowercase: 1,
    minUppercase: 1,
    minNumeric: 1,
    minSpecialChars: 1,
    minLength: 8,
  },
  kyc: {
    appId: process.env.KYC_APP_ID,
    apiKey: process.env.KYC_API_KEY,
  },
  maxEventListeners: 20,
  defaultUserPicture: process.env.DEFAULT_USER_PICTURE,
  defaultUserCoverPictre: process.env.DEFAULT_USER_COVER_PICTURE,
  frontEndUrl: process.env.FRONT_BASE_URL,
  adminFrontEndUrl: process.env.ADMIN_FRONT_BASE_URL,
  creatorFrontEndUrl: process.env.CREATOR_FRONT_BASE_URL,
  // graphUrl: process.env.GRAPH_URL,
  graphUrlForDataRequest: process.env.GRAPH_URLFORDATAREQUEST,
  graphUrlForSurvey: process.env.GRAPH_URLFORSURVEY,
  graphUrlForExternalSource: process.env.GRAPH_URLFOREXTERNALSOURCE,
  graphUrlForRegularDispute: process.env.GRAPH_URL_REGULAR_DISPUTE,
  graphUrlForMiniDispute: process.env.GRAPH_URL_MINI_DISPUTE,
  graphUrlForDopMiniDispute: process.env.GRAPH_URL_DOP_MINI_DISPUTE,
  graphUrlForDopRegularDispute: process.env.GRAPH_URL_DOP_REGULAR_DISPUTE,
};
