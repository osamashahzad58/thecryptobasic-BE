const mongoose = require("mongoose");

const metaDataSchema = new mongoose.Schema(
  {
    dataRequestTimeStamp: {
      type: String,
      default: "0",
    },
    surveyTimeStamp: {
      type: String,
      default: "0",
    },
    disputeTimeStamp: {
      type: String,
      default: "0",
    },
    externalResourceTimeStamp: {
      type: String,
      default: "0",
    },
    dataRequestVoteTimeStamp: {
      type: String,
      default: "0",
    },
    externalResourceVoteTimeStamp: {
      type: String,
      default: "0",
    },
    externalResourceExtendTimeStamp: {
      type: String,
      default: "0",
    },
    surveyVoteTimeStamp: {
      type: String,
      default: "0",
    },
    externalResourceClaimTimeStamp: {
      type: String,
      default: "0",
    },
    dataRequestCalimTimeStamp: {
      type: String,
      default: "0",
    },
    surveyVoteTimeStamp: {
      type: String,
      default: "0",
    },
    surveyRefundTimeStamp: {
      type: String,
      default: "0",
    },
    disputeTimeStamp: {
      type: String,
      default: "0",
    },
    disputeMiniTimeStamp: {
      type: String,
      default: "0",
    },
    disputeMiniVoteTimeStamp: {
      type: String,
      default: "0",
    },
    disputeRegularVoteTimeStamp: {
      type: String,
      default: "0",
    },
    disputeDopMiniTimeStamp: {
      type: String,
      default: "0",
    },
    disputeDopRegularTimeStamp: {
      type: String,
      default: "0",
    },
    dopDisputeRegularVoteTimeStamp: {
      type: String,
      default: "0",
    },
    dopDisputeMiniVoteTimeStamp: {
      type: String,
      default: "0",
    },
    disputeRegularTimeUpdate: {
      type: String,
      default: "0",
    },
    disputeMiniTimeUpdate: {
      type: String,
      default: "0",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("meta_data", metaDataSchema);
