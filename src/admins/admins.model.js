const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const CONSTANTS = require("../common/constants/constants");

const adminsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      default: CONSTANTS.ROLES.ADMIN
    },
    profileImage: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    passwordResetToken: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  { timestamps: true }
);

adminsSchema.pre("save", async function (next) {
  // check if password is present and is modified.
  if (this.password && this.isModified("password")) {
    // call your hashPassword method here which will return the hashed password.
    this.password = await bcrypt.hash(this.password, 10);
  }
  // everything is done, so let's call the next callback.
  next();
});

adminsSchema.methods.isPasswordValid = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("admins", adminsSchema);
