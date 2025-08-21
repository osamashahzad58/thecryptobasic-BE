module.exports.METADATA_IMAGE = {
  MAX_FILES_SIZE_IN_MBS: 15,
  ALLOWED_MIME_TYPES: [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ],
  S3_UPLOAD_LOCATION: "theCryptoBasic/question",
  FIELD_NAME: "image",
};

module.exports.METADATA_VIDEO = {
  MAX_FILES_SIZE_IN_MBS: 100, //100mb
  ALLOWED_MIME_TYPES: ["video/mp4", "video/mpeg"],
  S3_UPLOAD_LOCATION: "theCryptoBasic/launchpad/video",
  FIELD_NAME: "video",
};
