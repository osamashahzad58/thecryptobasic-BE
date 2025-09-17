const axios = require("axios");
const configs = require("../../configs");
const { ObjectId } = require("mongodb");

const CmcCoinsModel = require("./models/cmc-coins.model");
const CoinsLoser = require("./models/cmc-topLosser.model");
const CoinsGainer = require("./models/cmc-topGainners.model");
const CoinsMostVisited = require("./models/cmc-mostVisited.model");
const CoinsStats = require("./models/cmc-stats.model");

exports.create = async (createDto, result = {}) => {
  try {
    console.log("getting list");
    const list = await CmcCoinsModel.create(createDto);
    console.log("checked list");

    result.data = list;
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
exports.getCompare = async (getCompareDto, result = {}) => {
  try {
    const { tokenA, tokenB } = getCompareDto;

    const [coinA, coinB] = await Promise.all([
      CmcCoinsModel.findOne({ name: { $regex: `^${tokenA}$`, $options: "i" } }),
      CmcCoinsModel.findOne({ name: { $regex: `^${tokenB}$`, $options: "i" } }),
    ]);

    if (!coinA || !coinB) {
      result.error = true;
      result.message = "One or both coins not found.";
      return result;
    }
    const priceA = parseFloat(coinA.price);
    const marketCapA = parseFloat(coinA.market_cap);
    const marketCapB = parseFloat(coinB.market_cap);
    const calculatedPrice = (marketCapB / marketCapA) * priceA;
    const multiplier = marketCapB / marketCapA;
    const formatCurrency = (num) =>
      `$${num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formattedComparison = `${formatCurrency(
      calculatedPrice
    )} (${multiplier.toFixed(2)}x)`;
    result.data = {
      tokenA: {
        name: coinA.name,
        symbol: coinA.symbol,
        price: priceA,
        marketCap: marketCapA,
      },
      tokenB: {
        name: coinB.name,
        symbol: coinB.symbol,
        price: parseFloat(coinB.price),
        marketCap: marketCapB,
      },
      comparison: formattedComparison,
    };
  } catch (ex) {
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

    const detailsUrl = `https://pro-api.coingecko.com/api/v3/coins/${id}?localization=true&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true`;

    const detailsResponse = await axios.get(detailsUrl, {
      headers: {
        "x-cg-pro-api-key": configs.privateKeys.ApiKeyCoingeko,
      },
    });

    const detailsData = detailsResponse.data;

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
exports.addMostVisited = async (addMostVisited, result = {}) => {
  try {
    console.log("addMostVisited");
    result.data = await CoinsMostVisited.insertMany(addMostVisited);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.deleteTopAndLoserGainers = async (result = {}) => {
  try {
    await Promise.all([
      CoinsGainer.deleteMany({}), // clears all docs
      CoinsLoser.deleteMany({}), // clears all docs
    ]);
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
exports.getAllCrypto = async (getAllCryptoDto, result = {}) => {
  try {
    const { limit, offset, orderField, orderDirection } = getAllCryptoDto;

    const filter = {};

    const sortOptions = {
      ...(orderField && { [orderField]: +orderDirection }),
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
    console.log({ id });
    const question = await CoinsStats.findOne({
      _id: ObjectId(id),
    });
    console.log(question, "question");
    result.data = question;
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
