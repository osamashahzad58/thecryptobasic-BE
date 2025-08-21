const router = require("express").Router();
const { validate } = require("express-validation");
const emailVerificationsController = require("./email-verification.controller");
const emailVerificationsValidation = require("./email-verification.validation");
const JWT = require("../common/auth/jwt");

router.post(
  "/",
  [validate(emailVerificationsValidation.createCode, { keyByField: true })],
  emailVerificationsController.createCode
);
module.exports = router;
