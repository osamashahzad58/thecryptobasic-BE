const axios = require("axios");
const configs = require("../../configs");

const CmcCoinsModel = require("./models/cmc-coins.model");

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
