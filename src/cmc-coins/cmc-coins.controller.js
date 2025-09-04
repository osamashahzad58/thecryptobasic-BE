const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");
const cmcCoinsService = require("./cmc-coins.service");

exports.getListings = async (req, res, next) => {
  try {
    const result = await cmcCoinsService.getListings();

    if (result.ex) throw result.ex;
    if (result.data.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Currency Lists",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.getMarketPairs = async (req, res, next) => {
  try {
    const getMarketPairsDto = { ...req.query };
    const result = await cmcCoinsService.getMarketPairs(getMarketPairsDto);

    if (result.ex) throw result.ex;
    if (result.data.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Currency Market Pairs",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};

exports.address = async (req, res, next) => {
  try {
    const addressDto = { ...req.query };
    const result = await cmcCoinsService.address(addressDto);

    if (result.ex) throw result.ex;
    if (result.data.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Token By Contract Address",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getPriceChart = async (req, res, next) => {
  try {
    const getPriceChartsDto = { ...req.query };
    const result = await cmcCoinsService.getPriceChart(getPriceChartsDto);

    if (result.ex) throw result.ex;
    if (result.data.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Currency Price Chart",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getCompare = async (req, res, next) => {
  try {
    const getCompareDto = { ...req.query };
    const result = await cmcCoinsService.getCompare(getCompareDto);

    if (result.ex) throw result.ex;
    if (result.data.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Currency Price Chart",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getPricePerformanceStats = async (req, res, next) => {
  try {
    const getPricePerformanceStatsDto = { ...req.query };
    const result = await cmcCoinsService.getPricePerformanceAndDetails(
      getPricePerformanceStatsDto
    );

    if (result.ex) throw result.ex;
    if (result.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Price Performance Stats",
      data: {
        pricePerformance: result.pricePerformance,
        stats: result.details,
      },
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getStatsHighLow = async (req, res, next) => {
  try {
    const getPricePerformanceStatsDto = { ...req.query };
    const result = await cmcCoinsService.getStatsHighLow(
      getPricePerformanceStatsDto
    );

    if (result.ex) throw result.ex;
    if (result.error)
      throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Price Performance Stats",
      data: {
        pricePerformance: result.pricePerformance,
        stats: result.details,
      },
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getById = async (req, res, next) => {
  try {
    const getPricePerformanceStatsDto = { ...req.query };
    const result = await cmcCoinsService.getById(getPricePerformanceStatsDto);

    if (result.ex) throw result.ex;
    // if (result.error)
    //   throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "coin detail",
      data: {
        pricePerformance: result.pricePerformance,
        stats: result.details,
      },
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getCoinByIdWithCMC = async (req, res, next) => {
  try {
    const getCoinByIdWithCMCDto = { ...req.query };
    const result = await cmcCoinsService.getCoinByIdWithCMC(
      getCoinByIdWithCMCDto
    );

    if (result.ex) throw result.ex;
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "coin detail",
      data: {
        pricePerformance: result.pricePerformance,
        stats: result.details,
      },
    });
  } catch (ex) {
    next(ex);
  }
};
