const mongoose = require("mongoose");
const configs = require("../../configs");
const bcrypt = require("bcrypt");
const { KYC_STATUS } = require("./constants/users.constants");
const usersSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      trim: true,
      lowercase: true,
      // unique: true,
      sparse: true,
    },
    userName: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
      sparse: true,
    },
    role: {
      type: String,
      default: "user",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    otp: {
      type: String,
      unique: true,
      sparse: true,
    },
    otpExpiresTime: {
      type: Date,
    },
    status: {
      type: String,
      default: "active",
    },
    gender: { type: String },
    age: { type: Number },
    nationality: { type: String },
    ipCountry: { type: String },
    firstName: { type: String },
    dob: { type: String },
    fcmToken: {
      type: String,
      index: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    isKycVerified: { type: Boolean, default: false },
    isKycSubmited: { type: Boolean, default: false },
    blockStatus: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

usersSchema.index({ walletAddress: 1, role: 1, email: 1 }, { unique: true });

usersSchema.pre("save", async function (next) {
  // check if password is present and is modified.
  if (this.password && this.isModified("password")) {
    // call your hashPassword method here which will return the hashed password.
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

usersSchema.methods.isPasswordValid = function (password) {
  return bcrypt.compareSync(password, this.password);
};
module.exports = mongoose.model("Users", usersSchema);
