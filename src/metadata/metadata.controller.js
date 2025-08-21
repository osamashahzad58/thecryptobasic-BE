const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const metadataService = require("./metadata.service");
const configs = require("../../configs");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const { accessKey, accessSecret, s3: s3Config } = configs.aws;

AWS.config.update({
  accessKeyId: accessKey,
  secretAccessKey: accessSecret,
  region: s3Config.bucketRegion,
});

const s3 = new AWS.S3();

exports.uploadImage = async (req, res, next) => {
  try {
    const { location } = req.file;
    res.status(StatusCodes.CREATED).json({
      url: location,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.uploadVideo = async (req, res, next) => {
  try {
    const { location } = req.file;
    res.status(StatusCodes.CREATED).json({
      url: location,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    const files = req.files;

    const uploadPromises = files.map(async (file) => {
      const params = {
        Bucket: s3Config.bucketName,
        Key: `question/image/${file.originalname}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
      };
      try {
        const data = await s3.upload(params).promise();
        return data.Location;
      } catch (error) {
        console.error("Upload Error:", error);
        throw error;
      }
    });

    const urls = await Promise.all(uploadPromises);

    res.status(StatusCodes.CREATED).json({ urls });
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const deleteImageDto = {
      ...req.body,
      creatorId: req.user.id,
    };

    const result = await metadataService.deleteImage(deleteImageDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "image delete successfully",
    });
  } catch (ex) {
    next(ex);
  }
};
