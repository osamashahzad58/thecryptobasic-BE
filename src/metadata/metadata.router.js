const router = require("express").Router();
const { validate } = require("express-validation");
const metadataController = require("./metadata.controller");
const metadataValidation = require("./metadata.validation");
const JWT = require("../common/auth/jwt");
const { multerFileUploader } = require("../common/file/file.uploader");
const { multerMultipleFilesUploader } = require("../common/file/file.uploader");
const {
  METADATA_IMAGE,
  METADATA_VIDEO,
} = require("./constants/metadata.file.constant");
const { fileRequired } = require("../common/file/file.middleware");
const metadataMiddleware = require("./metadata.middleware");
const accessMiddleware = require("../common/middlewares/access.middleware");

const multer = require("multer");
const storage = multer.memoryStorage(); // You can use memory storage or disk storage, depending on your requirements
const uploadMultiple = multer({ storage: storage });

router.post(
  "/upload-image",
  [
    // JWT.verifyAccessToken,
    multerFileUploader({
      fieldName: METADATA_IMAGE.FIELD_NAME,
      destinationFolder: METADATA_IMAGE.S3_UPLOAD_LOCATION,
      allowedImageTypes: METADATA_IMAGE.ALLOWED_MIME_TYPES,
      maxFileSizeInMBs: METADATA_IMAGE.MAX_FILES_SIZE_IN_MBS,
    }),
    fileRequired(METADATA_IMAGE.FIELD_NAME),
  ],
  metadataController.uploadImage
);

router.post(
  "/upload-images",
  [
    // JWT.verifyAccessToken,
    uploadMultiple.array(
      METADATA_IMAGE.FIELD_NAME
      // maxCount:3,
      // METADATA_IMAGE.MAX_FILES_LIMIT
    ),
  ],
  metadataController.uploadImages
);

router.post(
  "/upload-video",
  [
    JWT.verifyAccessToken,
    multerFileUploader({
      fieldName: METADATA_VIDEO.FIELD_NAME,
      destinationFolder: METADATA_VIDEO.S3_UPLOAD_LOCATION,
      allowedImageTypes: METADATA_VIDEO.ALLOWED_MIME_TYPES,
      maxFileSizeInMBs: METADATA_VIDEO.MAX_FILES_SIZE_IN_MBS,
    }),
    fileRequired(METADATA_VIDEO.FIELD_NAME),
  ],
  metadataController.uploadVideo
);

router.delete(
  "/delete-image",
  [
    JWT.verifyAccessToken,
    accessMiddleware.isCreator,
    validate(metadataValidation.getImageUrl, { keyByField: true }),
    metadataMiddleware.verifyLaunchpadCreator,
  ],
  metadataController.deleteImage
);

module.exports = router;
