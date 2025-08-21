let Keys = require("./keys.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

exports.create = async (createDto, result = {}) => {
  try {
    const randomKey = crypto
      .randomBytes(128)
      .toString("base64")
      .replace(/[^0-9stuvwxyz@#$%^&*]/g, "")
      .slice(0, 128);
    createDto.key = randomKey;
    const savedKey = await Keys.create(createDto);
    result.data = savedKey;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getKey = async ({ id }, result = {}) => {
  try {
    const key = await Keys.findById(id).lean();
    result.data = key;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getByKey = async (key, result = {}) => {
  try {
    const data = await Keys.findOne(key).lean();
    if (!data) {
      result.notFound = true;
    }
    result.data = data;
  } catch (ex) {
    result.ex = ex.message || "An unexpected error occurred.";
  } finally {
    return result;
  }
};
exports.getKeys = async (getListDto, result = {}) => {
  try {
    const { name, limit, offset } = getListDto;
    const filter = {};
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    const keys = await Keys.find(filter)
      .limit(limit)
      .skip((offset - 1) * limit)
      .lean();
    keys.forEach((key) => {
      if (key.dispute && key.dispute.length === 0) {
        delete key.dispute;
      }
      if (key.survey && key.survey.length === 0) {
        delete key.survey;
      }
      if (key.data_request && key.data_request.length === 0) {
        delete key.data_request;
      }
    });
    result.data = keys;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.isEnabled = async ({ id }, result = {}) => {
  try {
    const data = await Keys.findById(id);

    if (data) {
      data.isEnabled = !data.isEnabled;
      await data.save();
      result.data = data;
    } else {
      result.NotExist = true;
    }
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
