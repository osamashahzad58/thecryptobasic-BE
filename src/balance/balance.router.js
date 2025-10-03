const router = require("express").Router();

const { validate } = require("express-validation");
const balanceController = require("./balance.controller");
const JWT = require("../common/auth/jwt");
const validation = require("./balance.validation");

router.post(
  "/",
  //   [JWT.verifyAccessToken],
  [
    // JWT.verifyAccessToken,
    validate(validation.create, { keyByField: true }),
  ],
  balanceController.create
);
// router.get("/", [JWT.verifyAccessToken], balanceController.byUserId);

module.exports = router;
