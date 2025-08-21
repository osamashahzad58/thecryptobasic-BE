const S3 = require("aws-sdk/clients/s3");
const configs = require("../../../../configs");
const _ = require("lodash");

const s3 = new S3({
  region: configs.aws.s3.bucketRegion,
  accessKeyId: configs.aws.accessKey,
  secretAccessKey: configs.aws.accessSecret,
});

exports.removeFile = (fileKey) => {
  const params = {
    Bucket: configs.aws.s3.bucketName,
    Key: fileKey,
  };
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

exports.removeMultipleFile = async (keys) => {
  // try {
  const bucketParams = {
    Bucket: configs.aws.s3.bucketName,
    Delete: {
      Objects: extractKeysFromUrlArray(keys),
    },
  };
  return new Promise((resolve, reject) => {
    s3.deleteObjects(bucketParams, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

exports.extractKeyFromUrl = function (url) {
  return url.split("amazonaws.com/")[1];
};

exports.multipartUpload = async (filename) => {
  const params = {
    Bucket: configs.aws.s3.bucketName,
    Key: filename,
  };
  const multipartUpload = await s3.createMultipartUpload(params).promise();
  return {
    fileId: multipartUpload.UploadId,
    fileKey: multipartUpload.Key,
  };
};

exports.completeMultipartUpload = async (multipartUploadDto) => {
  const { fileKey, fileId, parts } = multipartUploadDto;
  const params = {
    Bucket: configs.aws.s3.bucketName,
    Key: fileKey,
    UploadId: fileId,
    MultipartUpload: {
      Parts: _.orderBy(parts, ["PartNumber"], ["asc"]),
    },
  };

  return new Promise((resolve, reject) => {
    s3.completeMultipartUpload(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

exports.getSignedUrl = async (preSignedUrlDto) => {
  const { fileKey, fileId, parts } = preSignedUrlDto;
  const params = {
    Bucket: configs.aws.s3.bucketName,
    Key: fileKey,
    UploadId: fileId,
    Expires: 7200,
  };
  const promises = [];
  for (let index = 0; index < parts; index++) {
    promises.push(
      s3.getSignedUrlPromise("uploadPart", {
        ...params,
        PartNumber: index + 1,
      })
    );
  }
  const signedUrls = await Promise.all(promises);

  const partSignedUrlList = signedUrls.map((signedUrl, index) => {
    return {
      signedUrl: signedUrl,
      PartNumber: index + 1,
    };
  });
  return {
    parts: partSignedUrlList,
  };
};

extractKeyFromUrl = function (url) {
  return url.split("amazonaws.com/")[1];
};

extractKeysFromUrlArray = function (urls) {
  return urls.map((url) => ({ Key: extractKeyFromUrl(url) }));
};

exports.s3 = s3;
