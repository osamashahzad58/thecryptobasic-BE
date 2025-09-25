const express = require("express");
const { validate } = require("express-validation");
const router = express.Router();
const usersValidation = require("./users.validation");
const usersController = require("./users.controller");
const { multerMultipleFilesUploader } = require("../common/file/file.uploader");
const requestValidation = require("../common/request/request.validation");
const { USERS_IMAGES } = require("./constants/users.file.constants");
const { filesRequired } = require("../common/file/file.middleware");
const JWT = require("../common/auth/jwt");
const accessMiddleware = require("../common/middlewares/access.middleware");

router.post(
  "/profile",
  [
    JWT.verifyAccessToken,
    multerMultipleFilesUploader({
      fields: USERS_IMAGES.FIELDS,
      destinationFolder: USERS_IMAGES.S3_UPLOAD_LOCATION,
      allowedImageTypes: USERS_IMAGES.ALLOWED_MIME_TYPES,
      maxFileSizeInMBs: USERS_IMAGES.MAX_FILES_SIZE_IN_MBS,
      validationSchema: usersValidation.profile.body,
    }),
    validate(usersValidation.profile, {
      keyByField: true,
    }),
  ],
  usersController.profile
);
router.get(
  "/getWatchlist",
  JWT.verifyAccessToken,
  usersController.getUserWatchlist
);
router.post(
  "/verify-otp",
  [
    JWT.verifyAccessToken,
    validate(usersValidation.verifyOtp, { keyByField: true }),
  ],
  usersController.verifyOtp
);

router.post(
  "/send-otp",
  [
    JWT.verifyAccessToken,
    validate(usersValidation.sendOtp, { keyByField: true }),
  ],
  usersController.sendOtp
);

module.exports = router;
