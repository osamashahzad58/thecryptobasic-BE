const router = require("express").Router();

const { validate } = require("express-validation");
const cmcCoinsController = require("./cmc-coins.controller");
const cmcCoinsValidation = require("./cmc-coins.validation");
const JWT = require("../common/auth/jwt");

router.get(
  "/listings",
  [
    // JWT.verifyAccessToken,
  ],
  cmcCoinsController.getListings
);

router.get(
  "/market-pairs",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.getMarketPairs, { keyByField: true }),
  ],
  cmcCoinsController.getMarketPairs
);

router.get(
  "/address",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.address, { keyByField: true }),
  ],
  cmcCoinsController.address
);
router.get(
  "/price-chart",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.getPriceChart, { keyByField: true }),
  ],
  cmcCoinsController.getPriceChart
);
router.get(
  "/compare",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.getCompare, { keyByField: true }),
  ],
  cmcCoinsController.getCompare
);
router.get(
  "/getPricePerformanceStats",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.getPricePerformanceStats, { keyByField: true }),
  ],
  cmcCoinsController.getPricePerformanceStats
);
router.get(
  "/getStatsHighLow",
  [
    // JWT.verifyAccessToken,
    validate(cmcCoinsValidation.getStatsHighLow, { keyByField: true }),
  ],
  cmcCoinsController.getStatsHighLow
);
router.get(
  "/byId",
  [validate(cmcCoinsValidation.getById, { keyByField: true })],
  cmcCoinsController.getById
);
router.get(
  "/marketCapWithPricebyId",
  [validate(cmcCoinsValidation.getById, { keyByField: true })],
  cmcCoinsController.chartbyId
);
router.get(
  "/volumeWithPricebyId",
  [validate(cmcCoinsValidation.getById, { keyByField: true })],
  cmcCoinsController.volumeChartbyId
);
router.get(
  "/getCoinByIdWithCMC",
  [validate(cmcCoinsValidation.getById, { keyByField: true })],
  cmcCoinsController.getCoinByIdWithCMC
);

router.get(
  "/AllCrypto",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getAllCrypto
);
router.get(
  "/skipCoinId",
  [validate(cmcCoinsValidation.skipCoinId, { keyByField: true })],
  cmcCoinsController.getSkipCoinId
);
router.get(
  "/TopLossers",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getTopLossers
);
router.get(
  "/Most-Visited",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getMostVisited
);
router.get(
  "/Trending",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getTrending
);
router.get(
  "/New",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getNew
);
router.get(
  "/explore/new",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getExploreNew
);
router.get(
  "/TopGainers",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getTopGainers
);
router.get(
  "/search",
  [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getSearch
);
router.get(
  "/Topstats/:id",
  // [validate(cmcCoinsValidation.AllCrypto, { keyByField: true })],
  cmcCoinsController.getTopstats
);

module.exports = router;
