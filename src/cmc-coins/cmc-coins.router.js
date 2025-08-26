const router = require("express").Router();

const { validate } = require("express-validation");
const cmcCoinsController = require("./cmc-coins.controller");
const cmcCoinsValidation = require("./cmc-coins.validation");
//const JWT = require("../common/auth/jwt");

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
  "/getCoinByIdWithCMC",
  [validate(cmcCoinsValidation.getById, { keyByField: true })],
  cmcCoinsController.getCoinByIdWithCMC
);

module.exports = router;
