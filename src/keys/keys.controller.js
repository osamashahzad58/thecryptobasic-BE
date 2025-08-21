const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const keysService = require("./keys.service");

exports.create = async function (req, res, next) {
  try {
    const createDto = {
      ...req.body,
    };

    const result = await keysService.create(createDto);

    if (result.ex) throw result.ex;

    if (result.hasConflict)
      throw createError(StatusCodes.CONFLICT, result.conflictMessage);

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Key create successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getKey = async (req, res, next) => {
  try {
    const getKeyDto = {
      id: req.params.id,
    };

    const result = await keysService.getKey(getKeyDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get key successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getByKey = async (req, res, next) => {
  try {
    const getByKeyDto = {
      key: req.query.key,
    };
    const result = await keysService.getByKey(getByKeyDto);

    if (result.notFound)
      throw createError(StatusCodes.NOT_FOUND, "Key not found.");
    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Key successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getKeys = async (req, res, next) => {
  try {
    const getListDto = { ...req.query };
    const result = await keysService.getKeys(getListDto);
    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: 200,
      message: "List Of Keys successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.isEnabled = async (req, res, next) => {
  try {
    const isEnabledDto = {
      id: req.params.id,
    };

    const result = await keysService.isEnabled(isEnabledDto);

    if (result.ex) throw result.ex;

    if (result.NotExist)
      throw createError(StatusCodes.NOT_FOUND, "Key not found");

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Toggle verification successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
