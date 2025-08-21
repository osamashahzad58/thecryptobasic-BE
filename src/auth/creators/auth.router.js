const router = require("express").Router();
const { validate } = require("express-validation");
const authController = require("./auth.controller");
const authValidation = require("./auth.validation");
const JWT = require("../../common/auth/jwt");
const authsMiddleware = require("./auth.middleware");

router.post(
  "/login",
  validate(authValidation.login, { keyByField: true }),
  authController.loginUser
);

router.delete("/logout", [JWT.verifyAccessToken], authController.logout);

module.exports = router;
