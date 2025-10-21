const cmcList = require("./cmc.list.job");
const cmcStats = require("./cmc.stats.job");
const fetchCMCTopGainersAndLosers = require("./cmc-Top-GainerLosers.job");
const fetchCMCMostVisited = require("./cmc.mostVisited.job");
const fetchCMCTrending = require("./cmc-Trending.job");
const fetchCMCNewTokens = require("./cmc-new.job");
const fetchCMCBtcSentiment = require("./cmc-BtcSentiment.job");
const fetchCMCPrice = require("./cmc-price.job");
const fetchDominanceChart = require("./cmc-dominance-chart");
const { initializeJob } = require("./coins-price-emitters");
// require("../jobs/cmc-post.job");

module.exports = function registerScheduledJobs(getIO) {
  // Agar baaki jobs nahi chahiye to comment rehne do
  // cmcList.initializeJob();
  // fetchDominanceChart.initializeJob();
  // cmcStats.initializeJob();
  // fetchCMCBtcSentiment.initializeJob();
  fetchCMCTrending.initializeJob();
  fetchCMCTopGainersAndLosers.initializeJob();
  fetchCMCNewTokens.initializeJob();
  fetchCMCMostVisited.initializeJob();
  fetchCMCPrice.initializeJob();

  initializeJob(getIO);
};
