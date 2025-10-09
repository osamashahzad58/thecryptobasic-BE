const router = require("express").Router();

const { validate } = require("express-validation");
const transactionController = require("./transaction.controller");
const JWT = require("../common/auth/jwt");
const validation = require("./transaction.validation");

router.post(
  "/",
  [JWT.verifyAccessToken],
  [
    // JWT.verifyAccessToken,
    validate(validation.create, { keyByField: true }),
  ],
  transactionController.create
);
router.get(
  "/",
  [JWT.verifyAccessToken],
  [validate(validation.allAsset, { keyByField: true })],
  transactionController.byUserId
);
router.get(
  "/allAsset",
  [JWT.verifyAccessToken],
  [validate(validation.allAsset, { keyByField: true })],

  transactionController.allAsset
);
router.get(
  "/allAssetWithPortfolio",
  [JWT.verifyAccessToken],
  [validate(validation.allAssetWithPortfolio, { keyByField: true })],

  transactionController.allAssetWithPortfolio
);

router.get(
  "/stats",
  [JWT.verifyAccessToken],
  [validate(validation.stats, { keyByField: true })],
  transactionController.stats
);
router.get(
  "/chart",
  [JWT.verifyAccessToken],
  [validate(validation.stats, { keyByField: true })],
  transactionController.chart
);
router.put(
  "/:id",
  [JWT.verifyAccessToken],
  [validate(validation.update, { keyByField: true })],
  transactionController.update
);

module.exports = router;
