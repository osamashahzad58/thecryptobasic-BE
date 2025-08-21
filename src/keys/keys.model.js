const mongoose = require("mongoose");

const keySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true, // Ensures each key is unique
    },
    isEnabled: {
      type: Boolean,
      default: true, // Default is enabled
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically sets creation date
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Keys", keySchema);
