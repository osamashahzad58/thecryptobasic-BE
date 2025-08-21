const MetaData = require("./metadata.model");

exports.deleteImage = async (deleteImageDto, result = {}) => {
  try {
    const response = await dataRequestsService.deleteImage(deleteImageDto);

    if (response.ex) throw response.ex;

    result.data = response.ImageDeleteSuccess;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
module.exports.getMetaData = async (result = {}) => {
  try {
    const metaData = await MetaData.findOne({});
    result.data = metaData;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

module.exports.setMetaData = async (setMetaDataDto, result = {}) => {
  try {
    const metaData = await MetaData.findOneAndUpdate(
      { _id: "67628f8130c9ffe8266c4842" },
      { $set: setMetaDataDto },
      { new: true }
    );
    result.data = metaData;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
