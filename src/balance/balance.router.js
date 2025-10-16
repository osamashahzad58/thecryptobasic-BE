const router = require("express").Router();

const { validate } = require("express-validation");
const balanceController = require("./balance.controller");
const JWT = require("../common/auth/jwt");
const validation = require("./balance.validation");

router.post(
  "/",
  [JWT.verifyAccessToken],
  [validate(validation.create, { keyByField: true })],
  balanceController.create
);
// router.get("/", [JWT.verifyAccessToken], balanceController.byUserId);
router.get("/", [JWT.verifyAccessToken], balanceController.getList);
router.get(
  "/combinePortfolio",
  [JWT.verifyAccessToken],
  balanceController.getCombinePortfolio
);
router.get(
  "/fromBlockchain",
  [JWT.verifyAccessToken],
  [validate(validation.allAsset, { keyByField: true })],

  balanceController.allAsset
);
router.get(
  "/stats",
  [JWT.verifyAccessToken],
  [validate(validation.stats, { keyByField: true })],
  balanceController.stats
);
router.get("/:id", balanceController.getByBalance);

module.exports = router;
