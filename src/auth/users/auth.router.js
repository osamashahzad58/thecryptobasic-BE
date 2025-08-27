const router = require("express").Router();
const { validate } = require("express-validation");
const authController = require("./auth.controller");
const authValidation = require("./auth.validation");
const JWT = require("../../common/auth/jwt");
const authsMiddleware = require("./auth.middleware");

router.post(
  "/signin",
  [validate(authValidation.signin, { keyByField: true })],
  authController.signin
);

router.post(
  "/signup",
  [validate(authValidation.signup, { keyByField: true })],
  authController.signup
);
router.post(
  "/register",
  validate(authValidation.register, { keyByField: true }),
  authController.registerUser
);
router.post(
  "/login",
  validate(authValidation.login, { keyByField: true }),
  authController.loginUser
);

router.post(
  "/refresh-token",
  [
    validate(authValidation.generateNewAccessToken, { keyByField: true }),
    JWT.verifyRefreshToken,
  ],
  authController.refreshToken
);

router.post(
  "/forget-password",
  [validate(authValidation.forgetPassword, { keyByField: true })],
  authController.forgetPassword
);

router.post(
  "/verify-Email",
  // change
  [validate(authValidation.verify_Email, { keyByField: true })],
  authsMiddleware.isOtpValid,
  authController.verify_Email
);
router.post(
  "/reset-password",
  [
    JWT.verifyPasswordResetToken,
    validate(authValidation.updatePassword, { keyByField: true }),
  ],
  authController.resetPassword
);
router.post("/signupWithGoogle", authController.signupWithGoogle);

router.delete("/logout", [JWT.verifyAccessToken], authController.logout);

module.exports = router;
