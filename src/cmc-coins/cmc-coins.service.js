const axios = require("axios");
const configs = require("../../configs");
const { ObjectId } = require("mongodb");

const CmcCoinsModel = require("./models/cmc-coins.model");
const CmcBtcSentimentModel = require("./models/cmc-BtcSentiment");
const AltcoinCoinsModel = require("./models/cmc-Altcoin-Season");
const CmcCoinsNew = require("./models/cmc-new.model");
const CoinsLoser = require("./models/cmc-topLosser.model");
const CoinsTrending = require("./models/cmc-trending.model");
const CoinsAltcoin = require("./models/cmc-Altcoin-Season");
const CoinsGainer = require("./models/cmc-topGainners.model");
const CoinsMostVisited = require("./models/cmc-mostVisited.model");
const CoinsStats = require("./models/cmc-stats.model");
const Watchlist = require("../watchlist/watchlist.model");

exports.create = async (createDto, result = {}) => {
  try {
    const list = await CmcCoinsModel.create(createDto);

    result.data = list;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getTopGainersWithData = async (getTopGainersDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTopGainersDto;

    const filter = {};
    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    // Fetch paginated coins
    const [coins, count] = await Promise.all([
      CoinsGainer.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsGainer.countDocuments(filter),
    ]);

    // Extract coinIds and fetch related coin details
    const coinIds = coins.map((c) => c.coinId);
    const coinDetails = await CmcCoinsModel.find({
      coinId: { $in: coinIds },
    }).select(
      "coinId createdAt percent_change_7d percent_change_24h percent_change_1h volume_24h market_cap sparkline_7d cmcRank"
    );

    // Merge coin details directly into each coin
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price || merged.currentprice,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getTrendingWithData = async (getTopGainersDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTopGainersDto;

    const filter = {};
    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsTrending.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsTrending.countDocuments(filter),
    ]);

    const coinIds = coins.map((c) => c.coinId);
    const coinDetails = await CmcCoinsModel.find({
      coinId: { $in: coinIds },
    }).select(
      "coinId createdAt percent_change_7d percent_change_24h percent_change_1h volume_24h market_cap sparkline_7d cmcRank logo price"
    );

    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price || merged.currentprice,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getTopLossersWithData = async (getTopGainersDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTopGainersDto;

    const filter = {};
    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    // Fetch paginated coins
    const [coins, count] = await Promise.all([
      CoinsLoser.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsLoser.countDocuments(filter),
    ]);

    // Extract coinIds and fetch related coin details
    const coinIds = coins.map((c) => c.coinId);
    const coinDetails = await CmcCoinsModel.find({
      coinId: { $in: coinIds },
    }).select(
      "coinId createdAt percent_change_7d percent_change_24h percent_change_1h volume_24h market_cap sparkline_7d cmcRank"
    );

    // Merge coin details directly into each coin
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price || merged.currentprice,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getListings = async (result = {}) => {
  try {
    const listingResp = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?convert=USD&aux=num_market_pairs,cmc_rank`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );
    const tokens = listingResp.data.data;
    let coinIds = [];
    for (coin of tokens) {
      coinIds.push(coin.id);
    }
    const listingResp2 = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${coinIds.toString()}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );
    const metaData = listingResp2.data.data;
    let coindata = [];

    for (coin of tokens) {
      coindata.push({
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        slug: coin.slug,
        cmcRank: coin.cmc_rank,
        price: coin.quote.USD.price,
        volume_24h: coin.quote.USD.volume_24h,
        volume_change_24h: coin.quote.USD.volume_change_24h,
        percent_change_1h: coin.quote.USD.percent_change_1h,
        market_cap: coin.quote.USD.market_cap,
        market_cap_dominance: coin.quote.USD.market_cap_dominance,
        fully_diluted_market_cap: coin.quote.USD.fully_diluted_market_cap,
        logo: metaData[coin.id].logo,
        // all_time_high_low: periods[coin.id].periods,
      });
    }

    result.data = coindata;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.address = async (addressDto, result = {}) => {
  try {
    const { address } = addressDto;

    // Make the API request to CoinMarketCap
    const { data } = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?address=${address}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );

    result.data = data;
  } catch (ex) {
    console.error(
      "Error fetching data:",
      ex.response ? ex.response.data : ex.message
    );
    result.error = ex.response ? ex.response.data : ex.message;
  } finally {
    return result;
  }
};

exports.getAltCoin = async (getAltCoinDto, result = {}) => {
  try {
    // Fixed document _id
    const fixedId = "68f63f5b02765f1573f0de1e";

    // Fetch the document from MongoDB
    const dbData = await AltcoinCoinsModel.findOne({ _id: fixedId }).lean();

    // Return only the relevant data
    result.data = dbData || {};
  } catch (ex) {
    console.error(
      "Error fetching Altcoin Season data:",
      ex.response?.data || ex.message
    );
    result.error = ex.response?.data || ex.message;
  } finally {
    return result;
  }
};

exports.getMarketPairs = async (getMarketPairsDto, result = {}) => {
  try {
    const { id, limit, offset } = getMarketPairsDto;
    const start = (offset - 1) * limit + 1;

    const listingResp = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/market-pairs/latest?id=${id}&convert=USD&aux=cmc_rank,effective_liquidity&sort=cmc_rank_advanced&sort_dir=desc&start=${start}&limit=${limit}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );

    result.data = listingResp.data.data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getPriceChart = async (getPriceChartsDto, result = {}) => {
  try {
    const { id, interval, count } = getPriceChartsDto;
    let intervalVal = "5m";
    if (interval) {
      intervalVal = interval;
    }
    let countVal = "50";
    if (count) {
      countVal = count;
    }

    const listingResp = await axios.get(
      `https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical?id=${id}&count=${count}&interval=${intervalVal}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }
    );
    const idData = listingResp.data.data[id];
    result.data = idData.quotes;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getConverter = async (getConverterDto = {}, result = {}) => {
  try {
    const { tokenA, tokenB } = getConverterDto;
    console.log(getConverterDto, "getConverterDto");

    if (!tokenA || !tokenB) {
      result.error = true;
      result.message = "Both tokenA and tokenB are required.";
      return result;
    }

    // Try to match by coinId, symbol, or name (case-insensitive)
    const [coinA, coinB] = await Promise.all([
      CmcCoinsModel.findOne({
        $or: [
          { coinId: tokenA },
          { symbol: { $regex: `^${tokenA}$`, $options: "i" } },
          { name: { $regex: `^${tokenA}$`, $options: "i" } },
        ],
      }),
      CmcCoinsModel.findOne({
        $or: [
          { coinId: tokenB },
          { symbol: { $regex: `^${tokenB}$`, $options: "i" } },
          { name: { $regex: `^${tokenB}$`, $options: "i" } },
        ],
      }),
    ]);

    if (!coinA || !coinB) {
      result.error = true;
      result.message = "One or both coins not found.";
      return result;
    }

    // Parse values safely
    const priceA = parseFloat(coinA.price) || 0;
    const priceB = parseFloat(coinB.price) || 0;
    const marketCapA = parseFloat(coinA.market_cap) || 0;
    const marketCapB = parseFloat(coinB.market_cap) || 0;

    if (!priceA || !marketCapA || !marketCapB) {
      result.error = true;
      result.message = "Invalid or missing market data for one or both coins.";
      return result;
    }

    // Calculate conversion
    const calculatedPrice = (marketCapB / marketCapA) * priceA;
    const multiplier = marketCapB / marketCapA;

    // Format currency
    const formatCurrency = (num) =>
      `$${num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    result.data = {
      tokenA: {
        name: coinA.name,
        symbol: coinA.symbol,
        logo: coinA.logo,
        volume_change_24h: coinA.volume_change_24h,
        volume_24h: coinA.volume_24h,
        percent_change_24h: coinA.percent_change_24h,
        price: priceA,
        marketCap: marketCapA,
      },
      tokenB: {
        name: coinB.name,
        symbol: coinB.symbol,
        logo: coinB.logo,
        volume_change_24h: coinB.volume_change_24h,
        volume_24h: coinB.volume_24h,
        percent_change_24h: coinB.percent_change_24h,
        price: priceB,
        marketCap: marketCapB,
      },
      comparison: {
        calculatedPrice,
        formatted: `${formatCurrency(calculatedPrice)} (${multiplier.toFixed(
          2
        )}x)`,
        multiplier: Number(multiplier.toFixed(4)),
      },
    };

    result.message = "Conversion calculated successfully.";
  } catch (ex) {
    console.error("[getConverter] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

// exports.getPricePerformanceStats = async (
//   getPricePerformanceStatsDto,
//   result = {}
// ) => {
//   try {
//     const { id } = getPricePerformanceStatsDto;

//     // Constructing the URL for the new API endpoint
//     const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/price-performance-stats/latest?id=${id}`;

//     // Making the API request
//     const response = await axios.get(url, {
//       headers: {
//         "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
//       },
//     });

//     // Handling the API response
//     const data = response.data.data;
//     result.data = data;
//     console.log(data, "data");
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };
// exports.getPricePerformanceAndDetails = async (getPricePerformanceStatsDto) => {
//   const result = {};

//   try {
//     const { id } = getPricePerformanceStatsDto;
//     const quotesUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${id}`;

//     // Making the API request
//     const response = await axios.get(quotesUrl, {
//       headers: {
//         "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
//       },
//     });

//     // Handling the API response
//     const { quotesData } = response.data;
//     if (!quotesData || !quotesData[id]) {
//       throw new Error(`No data found for ID: ${id}`);
//     }

//     // Extracting the required fields
//     const { market_cap, total_supply, circulating_supply } = quotesData[id];
//     result.market_cap = market_cap;
//     result.total_supply = total_supply;
//     result.circulating_supply = circulating_supply;

//     // Optionally, store full data in result for future use
//     result.quotesData = quotesData;
//   } catch (error) {
//     result.error = error.message; // Store error message in result
//   }

//   return result;
// };

exports.getPricePerformanceAndDetails = async (getPricePerformanceStatsDto) => {
  const result = {};

  try {
    const { id } = getPricePerformanceStatsDto;

    // Constructing URLs for both API endpoints
    const pricePerformanceUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/price-performance-stats/latest?id=${id}`;
    const detailsUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${id}`;

    // Making concurrent requests to both endpoints
    const [pricePerformanceResponse, detailsResponse] = await Promise.all([
      axios.get(pricePerformanceUrl, {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }),
      axios.get(detailsUrl, {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }),
    ]);

    // Handling price-performance stats API response
    const pricePerformanceData = pricePerformanceResponse.data.data;
    result.pricePerformance = pricePerformanceData;

    // Handling detailed cryptocurrency information API response
    const detailsData = detailsResponse.data.data;
    if (!detailsData[id]) {
      throw new Error(`No data found for ID: ${id}`);
    }

    // Extracting the required fields
    const { market_cap, total_supply, circulating_supply } = detailsData[id];
    result.market_cap = market_cap;
    result.total_supply = total_supply;
    result.circulating_supply = circulating_supply;

    // Optionally, store full data in result for future use
    result.details = detailsData;
  } catch (error) {
    result.error = error.message; // Store error message in result
  }

  return result;
};
exports.getStatsHighLow = async (getPricePerformanceStatsDto) => {
  const result = {};

  try {
    const { id, time_period } = getPricePerformanceStatsDto;

    // Constructing URLs for both API endpoints
    const pricePerformanceUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/price-performance-stats/latest?id=${id}&time_period=${time_period}`;
    // Making concurrent requests to both endpoints
    const [pricePerformanceResponse] = await Promise.all([
      axios.get(pricePerformanceUrl, {
        headers: {
          "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
        },
      }),
    ]);

    // Handling price-performance stats API response
    const pricePerformanceData = pricePerformanceResponse.data.data;
    result.pricePerformance = pricePerformanceData;

    // Handling detailed cryptocurrency information API response
    // Optionally, store full data in result for future use
  } catch (error) {
    result.error = error.message; // Store error message in result
  }

  return result;
};
exports.getById = async (getPricePerformanceStatsDto) => {
  const result = {};
  try {
    const { id } = getPricePerformanceStatsDto;
    const dbData = await CmcCoinsModel.findOne({ coinId: String(id) });

    const detailsData = dbData;

    if (!detailsData || !detailsData.id) {
      throw new Error(`No data found for ID: ${id}`);
    }

    result.details = detailsData;
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      result.error = error.response.data;
    } else {
      result.error = error.message;
    }
  }
  return result;
};
exports.getSlug = async (getSlugDtoDto) => {
  const result = {};
  try {
    const { slug } = getSlugDtoDto;
    const dbData = await CmcCoinsModel.findOne({ slug: String(slug) });

    const detailsData = dbData;

    if (!detailsData || !detailsData.id) {
      throw new Error(`No data found for ID: ${id}`);
    }

    result.details = detailsData;
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      result.error = error.response.data;
    } else {
      result.error = error.message;
    }
  }
  return result;
};
exports.chartbyId = async ({ id }) => {
  const result = {};
  try {
    // Coin ke data lao
    const dbData = await CmcCoinsModel.findOne(
      { coinId: String(id) },
      { chart: 1, _id: 0, name: 1 } // sirf chart field chahiye
    ).lean();

    if (!dbData || !dbData.chart) {
      throw new Error(`No chart data found for ID: ${id}`);
    }

    // chart ko filter karo -> sirf price, volume, timestamp rakho
    const chart = dbData.chart.map((c) => ({
      market_cap: c.market_cap,
      volume: c.volume,
      timestamp: c.timestamp,
      // name: dbData.name,
    }));

    result.data = chart;
    result.message = "Chart data fetched successfully";
  } catch (ex) {
    console.error("Error response:", ex.message);
    result.ex = ex.message;
  } finally {
    return result;
  }
};
exports.volumeChartbyId = async ({ id }) => {
  const result = {};
  try {
    // Coin ke data lao
    const dbData = await CmcCoinsModel.findOne(
      { coinId: String(id) },
      { chart: 1, _id: 0, name: 1 } // sirf chart field chahiye
    ).lean();

    if (!dbData || !dbData.chart) {
      throw new Error(`No chart data found for ID: ${id}`);
    }

    // chart ko filter karo -> sirf price, volume, timestamp rakho
    const chart = dbData.chart.map((c) => ({
      price: c.price,
      volume: c.volume,
      timestamp: c.timestamp,
      // name: dbData.name,
    }));

    result.data = chart;
    result.message = "Chart data fetched successfully";
  } catch (ex) {
    console.error("Error response:", ex.message);
    result.ex = ex.message;
  } finally {
    return result;
  }
};

exports.getCoinByIdWithCMC = async (getPricePerformanceStatsDto) => {
  const result = {};
  try {
    const { id } = getPricePerformanceStatsDto;

    const detailsUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/market-pairs/latest?id=${id}&category=spot&sort=cmc_rank_advanced&aux=num_market_pairs,category,fee_type,market_url,currency_name,currency_slug,price_quote,notice,cmc_rank,effective_liquidity,market_score,market_reputation`;

    const detailsResponse = await axios.get(detailsUrl, {
      headers: {
        "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey,
      },
    });

    const detailsData = detailsResponse.data;

    result.details = detailsData.data;
  } catch (ex) {
    console.error("Error response:", ex.response?.data || ex.message);
    result.ex = ex.response?.data || ex.message;
  } finally {
    return result;
  }
};
exports.addTopGainers = async (addTopGainers, result = {}) => {
  try {
    // insertMany allows bulk inserts
    result.data = await CoinsGainer.insertMany(addTopGainers, {
      ordered: false,
      rawResult: false,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.addLoserGainers = async (addLoserGainers, result = {}) => {
  try {
    result.data = await CoinsLoser.insertMany(addLoserGainers, {
      ordered: false,
      rawResult: false,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.addTrending = async (addTrending, result = {}) => {
  try {
    result.data = await CoinsTrending.insertMany(addTrending, {
      ordered: false,
      rawResult: false,
    });
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.addNewTokens = async (coins) => {
  try {
    const inserted = await CmcCoinsNew.insertMany(coins, {
      ordered: false, // skip duplicates instead of failing
    });
    return inserted;
  } catch (ex) {
    console.error("Error in addNewTokens:", ex.message);
    if (ex.writeErrors) {
      console.error("Write errors:", ex.writeErrors);
    }
    throw ex;
  }
};
exports.addMostVisited = async (addMostVisited, result = {}) => {
  try {
    result.data = await CoinsMostVisited.insertMany(addMostVisited);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteTopAndLoserGainers = async (result = {}) => {
  try {
    const remove = await Promise.all([
      CoinsGainer.deleteMany({}), // clears all docs
      CoinsLoser.deleteMany({}), // clears all docs
    ]);
    console.log(remove, "remove:::::::");
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.deleteMostVisited = async (result = {}) => {
  try {
    await Promise.all([CoinsMostVisited.deleteMany({})]);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.deleteTrending = async (result = {}) => {
  try {
    await Promise.all([CoinsTrending.deleteMany({})]);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.deleteNewTokens = async (result = {}) => {
  try {
    const deletionResult = await CmcCoinsNew.deleteMany({});
    console.log(deletionResult?.length ?? 0, "deletionResult ::::::::"); // safely logs length or 0
    result.data = deletionResult;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

// exports.getAllCrypto = async (getAllCryptoDto, result = {}) => {
//   try {
//     const { limit, offset, orderField, orderDirection, userId } =
//       getAllCryptoDto;
//     console.log(userId, "userId");
//     const filter = {};
//     const sortOptions = {
//       ...(orderField && { [orderField]: +orderDirection || 1 }),
//     };

//     // 1. Fetch coins and total count
//     const [coins, count] = await Promise.all([
//       CmcCoinsModel.find(filter, {}, { sort: sortOptions })
//         .limit(Number(limit))
//         .skip((Number(offset) - 1) * Number(limit)),
//       CmcCoinsModel.countDocuments(filter),
//     ]);

//     let watchlistCoinIds = new Set();

//     // 2. If userId is provided, fetch user’s watchlist
//     if (userId) {
//       const watchlist = await Watchlist.find({ userId }).lean();
//       watchlistCoinIds = new Set(watchlist.map((w) => w.coinId));
//     }

//     // 3. Attach isWatchlist to each coin
//     const coinsWithWatchlist = coins.map((coin) => ({
//       ...coin.toObject(),
//       isWatchlist: userId ? watchlistCoinIds.has(coin.coinId) : false,
//     }));

//     // 4. Final response
//     result.data = {
//       count,
//       pages: Math.ceil(count / limit),
//       coins: coinsWithWatchlist,
//     };
//   } catch (ex) {
//     result.ex = ex;
//   } finally {
//     return result;
//   }
// };

exports.getAllCrypto = async (getAllCryptoDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection, userId } =
      getAllCryptoDto;

    const filter = {};
    const sortOptions = orderField
      ? { [orderField]: Number(orderDirection) || 1 }
      : {};

    // 1. Define the fields you actually want
    const projection = {
      coinId: 1,
      name: 1,
      symbol: 1,
      logo: 1,
      price: 1,
      market_cap: 1,
      percent_change_1h: 1,
      percent_change_24h: 1,
      percent_change_7d: 1,
      volume_change_24h: 1,
      sparkline_7d:
        1 ||
        "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
      percent_change_24h: 1,
      volume_24h: 1,
      slug: 1,
    };

    // 2. Fetch paginated coins + total count
    const [coins, count] = await Promise.all([
      CmcCoinsModel.find(filter, projection, { sort: sortOptions })
        .limit(Number(limit))
        .skip((Number(offset) - 1) * Number(limit))
        .lean(),
      CmcCoinsModel.countDocuments(filter),
    ]);

    // 3. Get user’s watchlist (if logged in)
    let watchlistMap = new Map();
    if (userId) {
      const watchlist = await Watchlist.find({ userId }).lean();
      watchlist.forEach((w) => {
        watchlistMap.set(w.coinId, w.isWatchlist); // true / false
      });
    }

    // 4. Attach isWatchlist to each coin
    const coinsWithWatchlist = coins.map((coin) => ({
      coinId: coin.coinId,
      name: coin.name,
      symbol: coin.symbol,
      logo: coin.logo,
      slug: coin.slug,
      sparkline_7d: coin.sparkline_7d,
      percent_change_24h: coin.percent_change_24h,
      price: Number(coin.price || 0),
      market_cap: Number(coin.market_cap || 0),
      percent_change_1h: Number(coin.percent_change_1h || 0),
      percent_change_24h: Number(coin.percent_change_24h || 0),
      percent_change_7d: Number(coin.percent_change_7d || 0),
      volume_change_24h: Number(coin.volume_change_24h || 0),
      volume_24h: Number(coin.volume_24h || 0),
      isWatchlist: watchlistMap.get(coin.coinId) || false,
    }));

    // 5. Return final response
    result.data = {
      count,
      pages: Math.ceil(count / limit),
      coins: coinsWithWatchlist,
    };

    result.message = "Coins fetched successfully";
  } catch (ex) {
    console.error("[getAllCrypto] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getSkipCoinId = async (getSkipCoinIdDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection, slug, userId } =
      getSkipCoinIdDto;
    console.log(getSkipCoinIdDto, "getSkipCoinIdDto");
    // 1. Build filter
    const filter = {};
    if (slug) {
      filter.slug = { $ne: slug.toString() }; // skip that coinId
    }

    // 2. Sorting
    const sortOptions = orderField
      ? { [orderField]: Number(orderDirection) || 1 }
      : {};

    // 3. Projection (fetch only needed fields)
    const projection = {
      name: 1,
      price: 1,
      logo: 1,
      percent_change_1h: 1,
      percent_change_24h: 1,
      symbol: 1,
      coinId: 1,
      sparkline_7d: 1,
      slug: 1,
    };

    // 4. Fetch coins and total count
    const [coins, count] = await Promise.all([
      CmcCoinsModel.find(filter, projection, { sort: sortOptions })
        .limit(Number(limit))
        .skip((Number(offset) - 1) * Number(limit))
        .lean(),
      CmcCoinsModel.countDocuments(filter),
    ]);

    // 5. Build watchlist map (coinId -> isWatchlist)
    let watchlistMap = new Map();
    if (userId) {
      const watchlist = await Watchlist.find({ userId }).lean();
      watchlist.forEach((w) => {
        watchlistMap.set(w.coinId, w.isWatchlist); // store actual boolean
      });
    }

    // 6. Attach `isWatchlist` status for each coin
    const coinsWithWatchlist = coins.map((coin) => ({
      ...coin,
      isWatchlist: watchlistMap.get(coin.coinId) || false,
    }));

    // 7. Return final result
    result.data = {
      count,
      pages: Math.ceil(count / limit),
      coins: coinsWithWatchlist,
    };

    result.message = "Coins fetched successfully (excluding slug)";
  } catch (ex) {
    console.error("[slug] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getTopGainers = async (getTopGainersDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTopGainersDto;

    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsGainer.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsGainer.countDocuments(filter),
    ]);

    // Merge coin details directly into each coin and rename fields
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getMostVisited = async (getMostVisitedDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getMostVisitedDto;

    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsMostVisited.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsMostVisited.countDocuments(filter),
    ]);
    // Extract coinIds and fetch related coin details
    const coinIds = coins.map((c) => c.coinId);
    const coinDetails = await CmcCoinsModel.find({
      coinId: { $in: coinIds },
    }).select(
      "coinId createdAt percent_change_7d percent_change_24h percent_change_1h volume_24h market_cap sparkline_7d cmcRank logo price"
    );

    // Merge coin details directly into each coin and rename fields
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getTrending = async (getTrendingDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTrendingDto;

    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsTrending.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsTrending.countDocuments(filter),
    ]);

    // Extract coinIds and fetch related coin details
    const coinIds = coins.map((c) => c.coinId);
    const coinDetails = await CmcCoinsModel.find({
      coinId: { $in: coinIds },
    }).select(
      "coinId createdAt percent_change_7d percent_change_24h percent_change_1h volume_24h market_cap sparkline_7d cmcRank logo price"
    );

    // Merge coin details directly into each coin and rename fields
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData, // Return the merged and renamed coins
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getNew = async (getTrendingDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTrendingDto;
    console.log(getTrendingDto, "getTrendingDto::::::::");
    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsTrending.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsTrending.countDocuments(filter),
    ]);

    // Merge coin details directly into each coin and rename fields
    const coinsWithData = coins.map((c) => {
      const details = coinDetails.find((cd) => cd.coinId === c.coinId);
      const merged = {
        ...c.toObject(),
        ...(details ? details.toObject() : {}),
      };

      return {
        _id: merged._id,
        coinId: merged.coinId,
        symbol: merged.symbol,
        name: merged.name,
        slug: merged.slug,
        change24hVol: merged.change24hVol,
        change1h: merged.change1h,
        price: merged.price,
        rank: merged.cmcRank || merged.marketCapRank,
        logo: merged.logo || merged.imageurl,
        sparkline_7d:
          merged.sparkline_7d ||
          "https://s3.coinmarketcap.com/generated/sparklines/web/7d/2781/1.svg",
        percent_change_1h: merged.percent_change_1h,
        percent_change_24h: merged.percent_change_24h,
        percent_change_7d: merged.percent_change_7d,
        volume_24h: merged.volume_24h,
        market_cap: merged.market_cap,
        createdAt: merged.createdAt,
      };
    });

    result.data = {
      count,
      coins: coinsWithData,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getExploreNew = async (getTrendingDto, result = {}) => {
  try {
    const limit = Number(getTrendingDto.limit) || 20;
    const offset = Number(getTrendingDto.offset) || 1;

    const coins = await CmcCoinsNew.aggregate([
      {
        $lookup: {
          from: "cmccoins", // 👈 same as CmcCoinsModel ka collection name
          localField: "coinId",
          foreignField: "coinId",
          as: "fullData",
        },
      },
      { $skip: (offset - 1) * limit },
      { $limit: limit },
    ]);

    const count = await CmcCoinsNew.countDocuments();

    result.data = {
      count,
      coins,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    console.error("Error in getExploreNew:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getSearch = async (getSearchDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection, search } = getSearchDto;

    const filter = {};

    if (search && search.trim()) {
      if (search.startsWith("0x")) {
        // Search in contracts array
        filter["contracts.contract"] = { $regex: search, $options: "i" };
      } else {
        // Search by name or symbol
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { symbol: { $regex: search, $options: "i" } },
        ];
      }
    }

    const sortOptions = {
      ...(orderField && { [orderField]: orderDirection === "desc" ? -1 : 1 }),
    };

    const [coins, count] = await Promise.all([
      CmcCoinsModel.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CmcCoinsModel.countDocuments(filter),
    ]);

    result.data = {
      count,
      coins,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getTopLossers = async (getTopLossersDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getTopLossersDto;

    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
    };

    const [coins, count] = await Promise.all([
      CoinsLoser.find(filter, {}, { sort: sortOptions })
        .limit(limit)
        .skip((offset - 1) * limit),
      CoinsLoser.countDocuments(filter),
    ]);

    result.data = {
      count,
      coins,
      pages: Math.ceil(count / limit),
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getTopstats = async ({ id }, result = {}) => {
  try {
    const coinStats = await CoinsStats.findOne({
      _id: new ObjectId("68caa4310350aadf632b3add"),
    });
    const btcSentiment = await CmcBtcSentimentModel.findOne({
      _id: new ObjectId("68f63f5b02765f1573f0de1e"),
    });
    const altcoinseasons = await CoinsAltcoin.findOne({
      _id: new ObjectId("68f63f5b02765f1573f0de1e"),
    });
    result.data = {
      coinStats,
      btcSentiment,
      altcoinseasons,
    };
    result.success = true;
  } catch (ex) {
    console.error("Error while fetching the question:", ex.message);
    result.error = true;
    result.ex = ex.message;
    result.success = false;
  } finally {
    return result;
  }
};
exports.getPopularConversions = async (getDto = {}, result = {}) => {
  try {
    // Define 10 popular conversion pairs
    const popularPairs = [
      { tokenA: "BTC", tokenB: "ETH" },
      { tokenA: "BTC", tokenB: "BNB" },
      { tokenA: "BTC", tokenB: "SOL" },
      { tokenA: "BTC", tokenB: "XRP" },
      { tokenA: "ETH", tokenB: "SOL" },
      { tokenA: "ETH", tokenB: "BNB" },
      { tokenA: "ETH", tokenB: "ADA" },
      { tokenA: "BNB", tokenB: "SOL" },
      { tokenA: "SOL", tokenB: "XRP" },
      { tokenA: "BTC", tokenB: "ADA" },
    ];

    // Fetch all involved coins in one go for efficiency
    const allSymbols = [
      ...new Set(popularPairs.flatMap((p) => [p.tokenA, p.tokenB])),
    ];

    const coins = await CmcCoinsModel.find({
      symbol: { $in: allSymbols },
    }).lean();

    // Create quick lookup
    const coinMap = {};
    for (const coin of coins) {
      coinMap[coin.symbol.toUpperCase()] = coin;
    }

    // Format helper
    const formatCurrency = (num) =>
      `$${num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    // Compute conversions
    const conversions = [];

    for (const { tokenA, tokenB } of popularPairs) {
      const coinA = coinMap[tokenA.toUpperCase()];
      const coinB = coinMap[tokenB.toUpperCase()];

      if (!coinA || !coinB) continue;

      const priceA = parseFloat(coinA.price) || 0;
      const marketCapA = parseFloat(coinA.market_cap) || 0;
      const marketCapB = parseFloat(coinB.market_cap) || 0;

      if (!priceA || !marketCapA || !marketCapB) continue;

      const calculatedPrice = (marketCapB / marketCapA) * priceA;
      const multiplier = marketCapB / marketCapA;

      conversions.push({
        pair: `${tokenA}/${tokenB}`,
        from: {
          name: coinA.name,
          symbol: coinA.symbol,
          price: priceA,
          marketCap: marketCapA,
          logo: coinA.logo,
        },
        to: {
          name: coinB.name,
          symbol: coinB.symbol,
          price: parseFloat(coinB.price),
          marketCap: marketCapB,
          logo: coinB.logo,
        },
        conversion: {
          calculatedPrice,
          formatted: `${formatCurrency(calculatedPrice)} (${multiplier.toFixed(
            2
          )}x)`,
          multiplier: Number(multiplier.toFixed(4)),
        },
      });
    }

    result.data = conversions;
    result.message = "Top 10 popular conversions fetched successfully.";
  } catch (ex) {
    console.error("[getPopularConversions] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getCompare = async (getCompareDto, result = {}) => {
  try {
    const { coinIds = [] } = getCompareDto;

    if (!coinIds.length) {
      result.error = true;
      result.message = "No coinIds provided for comparison.";
      return result;
    }

    // Find all coins by coinId
    const coins = await CmcCoinsModel.find({
      coinId: { $in: coinIds.map(String) },
    });

    if (!coins.length) {
      result.error = true;
      result.message = "No matching coins found.";
      return result;
    }

    // Format data
    const data = coins.map((coin) => ({
      coinId: coin.coinId,
      name: coin.name,
      symbol: coin.symbol,
      logo: coin.logo,
      price: Number(coin.price || 0),
      priceChange24h: Number(coin.percent_change_24h || 0),
      marketCap: Number(coin.market_cap || 0),
      marketCapChange24h: Number(coin.market_cap_change_24h || 0),
      volume24h: Number(coin.volume_24h || 0),
      circulatingSupply: Number(coin.circulating_supply || 0),
      rank: Number(coin.cmcRank || 0),
      activeSince: coin.createdAt,
    }));

    result.data = {
      total: data.length,
      coins: data,
    };
  } catch (ex) {
    console.error("[getCompare] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
