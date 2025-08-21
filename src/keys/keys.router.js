const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const keysValidation = require("./keys.validation");
const keysController = require("./keys.controller");
const JWT = require("../common/auth/jwt");
const requestValidation = require("../common/request/request.validation");

const accessMiddleware = require("../common/middlewares/access.middleware");

router.get(
  "/getKey",
  [JWT.verifyAccessToken, accessMiddleware.isAdmin],
  keysController.getByKey
);
router.post(
  "/",
  // [JWT.verifyAccessToken, accessMiddleware.isAdmin],
  keysController.create
);
router.get(
  "/",
  [JWT.verifyAccessToken, accessMiddleware.isAdmin],
  keysController.getKeys
);
router.get(
  "/:id",
  [JWT.verifyAccessToken, accessMiddleware.isAdmin],
  keysController.getKey
);
router.post(
  "/:id/is-enabled",
  [
    JWT.verifyAccessToken,
    accessMiddleware.isAdmin,
    validate(requestValidation.idInParams, {
      keyByField: true,
    }),
  ],
  keysController.isEnabled
);
module.exports = router;
