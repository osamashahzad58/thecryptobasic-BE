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
// router.get("/", [JWT.verifyAccessToken], balanceController.byUserId);

module.exports = router;
