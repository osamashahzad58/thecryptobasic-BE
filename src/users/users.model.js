const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const usersSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "user",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true, // sirf email unique
      sparse: true,
    },
    otp: {
      type: String, // temporary, no unique constraint
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
      sparse: true, // ek device ke multiple users ka issue avoid karne ke liye unique hata diya
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

// Email unique index explicitly
usersSchema.index({ email: 1 }, { unique: true, sparse: true });

// password hashing middleware
usersSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// compare password method
usersSchema.methods.isPasswordValid = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("Users", usersSchema);
