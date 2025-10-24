const router = require("express").Router();
const { validate } = require("express-validation");
const portfolioController = require("./portfolio.controller");
const JWT = require("../common/auth/jwt");
const validation = require("./portfolio.validation");

router.post(
  "/",
  [JWT.verifyAccessToken],
  [
    // JWT.verifyAccessToken,
    validate(validation.create, { keyByField: true }),
  ],
  portfolioController.create
);
router.get("/", [JWT.verifyAccessToken], portfolioController.getList);
router.put(
  "/:id",
  [JWT.verifyAccessToken],
  // [validate(validation.update, { keyByField: true })],
  portfolioController.update
);
router.get(
  "/stats",
  [validate(validation.stats, { keyByField: true })],
  portfolioController.stats
);
router.get(
  "/portfolioAsset",
  [validate(validation.stats, { keyByField: true })],
  portfolioController.portfolioAsset
);
router.get("/:id", portfolioController.getByPortfolioId);

module.exports = router;
