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
exports.getConverter = async (req, res, next) => {
  try {
    const getConverterDto = { ...req.query };
    const result = await cmcCoinsService.getConverter(getConverterDto);

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
exports.chartbyId = async (req, res, next) => {
  try {
    const chartbyIdDto = { ...req.query };
    const result = await cmcCoinsService.chartbyId(chartbyIdDto);

    if (result.ex) throw result.ex;
    // if (result.error)
    //   throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "coin chart data",
      data: {
        stats: result.data,
      },
    });
  } catch (ex) {
    next(ex);
  }
};
exports.volumeChartbyId = async (req, res, next) => {
  try {
    const chartbyIdDto = { ...req.query };
    const result = await cmcCoinsService.volumeChartbyId(chartbyIdDto);

    if (result.ex) throw result.ex;
    // if (result.error)
    //   throw createError(StatusCodes.BAD_REQUEST, result.data.error.message);
    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "coin chart data",
      data: {
        stats: result.data,
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
exports.getAllCrypto = async (req, res, next) => {
  try {
    const getAllCryptoDto = {
      ...req.query,
    };

    const result = await cmcCoinsService.getAllCrypto(getAllCryptoDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get All Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getSkipCoinId = async (req, res, next) => {
  try {
    const getSkipCoinIdDto = { ...req.query };
    const result = await cmcCoinsService.getSkipCoinId(getSkipCoinIdDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get All Crypto Data",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getTopGainers = async (req, res, next) => {
  try {
    const getTopGainersDto = req.query;
    const result = await cmcCoinsService.getTopGainers(getTopGainersDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Top Gainers Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getMostVisited = async (req, res, next) => {
  try {
    const getMostVisitedDto = req.query;
    const result = await cmcCoinsService.getMostVisited(getMostVisitedDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Top Gainers Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getTrending = async (req, res, next) => {
  try {
    const getTrendingDto = req.query;
    const result = await cmcCoinsService.getTrending(getTrendingDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Top Gainers Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getNew = async (req, res, next) => {
  try {
    const getTrendingDto = req.query;
    const result = await cmcCoinsService.getNew(getTrendingDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get New Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getExploreNew = async (req, res, next) => {
  try {
    const getTrendingDto = req.query;
    const result = await cmcCoinsService.getExploreNew(getTrendingDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get New Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getSearch = async (req, res, next) => {
  try {
    const getSearchDto = req.query;
    const result = await cmcCoinsService.getSearch(getSearchDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Search Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getTopLossers = async (req, res, next) => {
  try {
    const getTopLossersDto = req.query;
    const result = await cmcCoinsService.getTopLossers(getTopLossersDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get Top Lossers Crypto",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
exports.getTopstats = async (req, res, next) => {
  try {
    // const getQuestionDto = {
    //   id: req.params.id,
    // };

    const getTopstatsDto = {
      id: req.params.id,
    };
    const result = await cmcCoinsService.getTopstats(getTopstatsDto);

    if (result.ex) throw result.ex;

    res.status(StatusCodes.OK).json({
      statusCode: StatusCodes.OK,
      message: "Get stats successfully",
      data: result.data,
    });
  } catch (ex) {
    next(ex);
  }
};
