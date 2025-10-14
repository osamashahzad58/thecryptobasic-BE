const cmcList = require("./cmc.list.job");
const cmcStats = require("./cmc.stats.job");
const fetchCMCTopGainersAndLosers = require("./cmc-Top-GainerLosers.job");
const fetchCMCMostVisited = require("./cmc.mostVisited.job");
const fetchCMCTrending = require("./cmc-Trending.job");
const fetchCMCNewTokens = require("./cmc-new.job");
const fetchCMCPrice = require("./cmc-price.job");
const { initializeJob } = require("./coins-price-emitters");
// require("../jobs/cmc-post.job");

module.exports = function registerScheduledJobs(getIO) {
  // Agar baaki jobs nahi chahiye to comment rehne do
  // cmcList.initializeJob();
  // cmcStats.initializeJob();
  // fetchCMCTrending.initializeJob();
  // fetchCMCTopGainersAndLosers.initializeJob();
  // fetchCMCNewTokens.initializeJob();
  // fetchCMCMostVisited.initializeJob();
  fetchCMCPrice.initializeJob();

  // sirf coin price emitter ka cron chalao
  initializeJob(getIO);
};
