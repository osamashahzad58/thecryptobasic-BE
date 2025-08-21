const router = require("express").Router();
const { validate } = require("express-validation");
const adminsValidation = require("./admins.validations");
const adminsController = require("./admins.controller");
const JWT = require("../common/auth/jwt");
const requestValidation = require("../common/request/request.validation");
const accessMiddleware = require("../common/middlewares/access.middleware");

router.get(
  "/stats",
  [JWT.verifyAccessToken, accessMiddleware.isAdmin],
  adminsController.getDashboardStats
);

module.exports = router;
