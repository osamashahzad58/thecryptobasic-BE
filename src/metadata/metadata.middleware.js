const createError = require("http-errors");
const { StatusCodes } = require("http-status-codes");
const cloudfrontUtil = require("../common/aws/s3/s3.util");

exports.verifyLaunchpadCreator = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    const { id } = req.user;

    const result = await dataRequestsService.verifyLaunchpadCreator({
      creatorId: id,
      imageUrl,
    });

    if (!result.data)
      throw createError(StatusCodes.NOT_FOUND, "Launchpad not found");

    next();
  } catch (ex) {
    next(ex);
  }
};
