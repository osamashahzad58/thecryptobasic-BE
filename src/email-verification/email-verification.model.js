const mongoose = require("mongoose");
const { Schema } = mongoose;

const emailVerificationSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otpCode: {
    type: String,
    required: true,
    unique: true,
  },
  verificationCodeTimestamp: {
    type: Date,
    default: Date.now() + 20 * 60 * 1000,
  },
});

// emailVerificationSchema.index(
//   { verificationCodeTimestamp: 1 },
//   // { expireAfterSeconds: 0 }
// );

const EmailVerification = mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);

module.exports = EmailVerification;
