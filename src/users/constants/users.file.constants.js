module.exports.USERS_IMAGES = {
  MAX_FILES_SIZE_IN_MBS: 15,
  ALLOWED_MIME_TYPES: [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ],
  S3_UPLOAD_LOCATION: "theCryptoBasic/users",
  FIELDS: [
    { name: "picture", maxCount: 1 },
    { name: "coverPicture", maxCount: 1 },
  ],
};
