const router = require("express").Router();

const { validate } = require("express-validation");
const transactionController = require("./transaction.controller");
const JWT = require("../common/auth/jwt");

router.post("/", [JWT.verifyAccessToken], transactionController.create);
router.get(
  "/byUserId",
  [JWT.verifyAccessToken],
  transactionController.byUserId
);

module.exports = router;
