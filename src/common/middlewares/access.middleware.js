const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const CONSTANTS = require("../constants/constants");

exports.isAdmin = (req, res, next) => {
  try {
    const { role } = req.user;

    if (role === CONSTANTS.ROLES.ADMIN) {
      next();
    } else {
      throw createError(StatusCodes.FORBIDDEN, `Only Admin can access`);
    }
  } catch (ex) {
    next(ex);
  }
};

exports.isCreator = (req, res, next) => {
  try {
    const { role } = req.user;

    if (role === CONSTANTS.ROLES.CREATOR) {
      next();
    } else {
      throw createError(StatusCodes.FORBIDDEN, `Only Creator can access`);
    }
  } catch (ex) {
    next(ex);
  }
};
