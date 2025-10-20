// cmc.stats.job.js
const CronJob = require("cron").CronJob;
const axios = require("axios");
const https = require("https");
const configs = require("../configs");
const CmcStats = require("../src/cmc-coins/models/cmc-stats.model");

// 1. Fetch Global Market Data from CMC
async function fetchCMCGlobal() {
  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
        timeout: 15000,
      }
    );
    return res.data?.data || {};
  } catch (err) {
    console.error("CMC Global fetch failed:", err.message);
    return {};
  }
}

// 2. Fetch Fear & Greed Index
async function fetchFearGreed() {
  try {
    const res = await axios.get("https://api.alternative.me/fng/?limit=1", {
      timeout: 10000,
    });
    return res.data?.data?.[0] || {};
  } catch (err) {
    console.error("Fear & Greed fetch failed:", err.message);
    return {};
  }
}

// 3. Fetch Altcoin Season Index from Bitget (robust with proxy fallback)
async function fetchAltcoinSeason() {
  const fallback = {
    altcoinSeason: 0,
    altcoinSeasonValue: "0/100",
    yesterday: 0,
    lastWeek: 0,
    lastMonth: 0,
    yearlyHigh: 0,
    yearlyHighDate: "",
    yearlyLow: 0,
    yearlyLowDate: "",
    altcoinMonth: 0,
    altcoinYear: 0,
  };

  const url = "https://www.bitget.com/v1/cms/altCoin/season/detail";

  const parseNum = (v) => {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const parseDateString = (ts) => {
    if (!ts && ts !== 0) return "";
    const asNum = Number(ts);
    if (!Number.isFinite(asNum) || asNum === 0) return "";
    // convert seconds -> ms if necessary
    const maybeMs = asNum < 1e12 ? asNum * 1000 : asNum;
    const dt = new Date(maybeMs);
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().split("T")[0];
  };

  // Browser-like header set
  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.bitget.com/",
    Origin: "https://www.bitget.com",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "sec-ch-ua":
      '"Chromium";v="120", "Not A(Brand";v="8", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    Connection: "keep-alive",
  };

  try {
    // First attempt: direct request with browser-like headers
    let res = await axios.get(url, {
      headers: browserHeaders,
      timeout: 15000,
      validateStatus: null, // we'll inspect status manually
    });

    if (res.status === 200 && res.data) {
      const raw = res.data ?? {};
      const d = raw.data ?? {};

      const altCoinIndex = parseNum(d.altCoinIndex);
      const day30AltCoinIndex = parseNum(d.day30AltCoinIndex);
      const day7AltCoinIndex = parseNum(d.day7AltCoinIndex);
      const yearHighAltCoinIndex = parseNum(d.yearHighAltCoinIndex);
      const yesterdayAltCoinIndex = parseNum(d.yesterdayAltCoinIndex);
      const yearLowAltCoinIndex = parseNum(d.yearLowAltCoinIndex);

      return {
        altcoinSeason: altCoinIndex,
        altcoinSeasonValue: `${altCoinIndex}/100`,
        yesterday: yesterdayAltCoinIndex,
        lastWeek: day7AltCoinIndex,
        lastMonth: day30AltCoinIndex,
        yearlyHigh: yearHighAltCoinIndex,
        yearlyHighDate: parseDateString(d.yearHighTime),
        yearlyLow: yearLowAltCoinIndex,
        yearlyLowDate: parseDateString(d.yearLowTime),
        altcoinMonth: day30AltCoinIndex,
        altcoinYear: altCoinIndex,
      };
    }

    // If we got a 403 or other non-200, try proxy fallback
    if (res.status === 403 || (res.status >= 400 && res.status < 500)) {
      console.warn(
        `Bitget request returned ${res.status}. Trying public proxy fallback...`
      );
      // Public proxy: AllOrigins (returns raw body)
      const proxyUrl =
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
      try {
        const proxyRes = await axios.get(proxyUrl, {
          timeout: 15000,
          validateStatus: null,
        });

        if (proxyRes.status === 200 && proxyRes.data) {
          // AllOrigins returns the proxied content (JSON) as body
          const raw = proxyRes.data;
          // If AllOrigins returns a JSON string, ensure it's parsed
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const d = parsed.data ?? {};

          const altCoinIndex = parseNum(d.altCoinIndex);
          const day30AltCoinIndex = parseNum(d.day30AltCoinIndex);
          const day7AltCoinIndex = parseNum(d.day7AltCoinIndex);
          const yearHighAltCoinIndex = parseNum(d.yearHighAltCoinIndex);
          const yesterdayAltCoinIndex = parseNum(d.yesterdayAltCoinIndex);
          const yearLowAltCoinIndex = parseNum(d.yearLowAltCoinIndex);

          return {
            altcoinSeason: altCoinIndex,
            altcoinSeasonValue: `${altCoinIndex}/100`,
            yesterday: yesterdayAltCoinIndex,
            lastWeek: day7AltCoinIndex,
            lastMonth: day30AltCoinIndex,
            yearlyHigh: yearHighAltCoinIndex,
            yearlyHighDate: parseDateString(d.yearHighTime),
            yearlyLow: yearLowAltCoinIndex,
            yearlyLowDate: parseDateString(d.yearLowTime),
            altcoinMonth: day30AltCoinIndex,
            altcoinYear: altCoinIndex,
          };
        } else {
          console.warn("Proxy fallback failed", {
            status: proxyRes.status,
            data: proxyRes.data,
          });
        }
      } catch (proxyErr) {
        console.error("Proxy fallback request failed:", proxyErr.message);
      }
    } else {
      // Non-403 non-200 response — log to help debugging
      console.warn("Bitget request returned non-200 status", {
        status: res.status,
        headers: res.headers,
      });
    }

    // If execution reaches here, parsing didn't succeed; return fallback
    return fallback;
  } catch (err) {
    // Network or unexpected error
    // If error.response exists, log status and headers for diagnostics
    if (err && err.response) {
      console.error("Bitget request failed:", err.message, {
        status: err.response.status,
        headers: err.response.headers,
        dataSnippet: JSON.stringify(err.response.data).slice(0, 500),
      });
    } else {
      console.error(
        "Bitget request error:",
        err && err.message ? err.message : err
      );
    }
    return fallback;
  }
}

// 4. Fetch ETH Gas (placeholder)
async function fetchEthGas() {
  try {
    // Replace with real API if needed
    return 0.36; // Default value in Gwei
  } catch (err) {
    console.error("ETH Gas fetch failed:", err.message);
    return 0;
  }
}

// 5. Fetch CMC100 Index
async function fetchCMC100() {
  try {
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v3/index/cmc100-latest",
      {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
        timeout: 15000,
      }
    );

    const data = res.data?.data || {};
    const currentValue = data?.value ?? 0;

    // Try direct percent_change_24h
    let change24h = data?.quotes?.USD?.percent_change_24h;

    // If not available, calculate manually
    if (change24h === undefined && data?.value_24h_ago) {
      change24h =
        ((currentValue - data.value_24h_ago) / data.value_24h_ago) * 100;
    }

    return {
      cmc100: currentValue,
      cmc100_change_24h: change24h ?? 0,
    };
  } catch (err) {
    console.error("CMC100 fetch failed:", err.message);
    return { cmc100: 0, cmc100_change_24h: 0 };
  }
}

// Main Job
async function cmcStats() {
  try {
    console.log("\n--- Fetching Stats ---");

    const [marketData, fearGreed, altcoinSeason, ethGas, cmc100Data] =
      await Promise.all([
        fetchCMCGlobal(),
        fetchFearGreed(),
        fetchAltcoinSeason(),
        fetchEthGas(),
        fetchCMC100(),
      ]);

    const stats = {
      cryptos: marketData.active_cryptocurrencies || 0,
      exchanges: marketData.active_exchanges || 0,
      market_cap: marketData.quote?.USD?.total_market_cap || 0,
      market_cap_change_24h:
        marketData.quote?.USD?.total_market_cap_yesterday_percentage_change ||
        0,
      volume_24h: marketData.quote?.USD?.total_volume_24h || 0,
      volume_change_24h:
        marketData.quote?.USD?.total_volume_24h_yesterday_percentage_change ||
        0,
      btc_dominance: marketData.btc_dominance || 0,
      eth_dominance: marketData.eth_dominance || 0,
      eth_gas: ethGas || 0,
      fear_greed: parseInt(fearGreed.value, 10) || 0,
      fear_greed_label: fearGreed.value_classification || "Unknown",

      // Bitget-derived fields
      altcoin_season: altcoinSeason?.altcoinSeason ?? 0,
      altcoin_season_value: altcoinSeason?.altcoinSeasonValue ?? "0/100",
      altcoin_yesterday: altcoinSeason?.yesterday ?? 0,
      altcoin_last_week: altcoinSeason?.lastWeek ?? 0,
      altcoin_last_month: altcoinSeason?.lastMonth ?? 0,
      altcoin_yearly_high: altcoinSeason?.yearlyHigh ?? 0,
      altcoin_yearly_high_date: altcoinSeason?.yearlyHighDate ?? "",
      altcoin_yearly_low: altcoinSeason?.yearlyLow ?? 0,
      altcoin_yearly_low_date: altcoinSeason?.yearlyLowDate ?? "",

      // Backward-compatible simple fields
      altcoin_month: altcoinSeason?.altcoinMonth ?? 0,
      altcoin_year: altcoinSeason?.altcoinYear ?? 0,

      cmc100: cmc100Data.cmc100,
      cmc100_change_24h: cmc100Data.cmc100_change_24h,
      timestamp: new Date(),
    };

    console.log("✅ Final Stats:", stats);
    // await CmcStats.create(stats);
    const updatedStats = await CmcStats.findOneAndUpdate(
      {},
      { $set: stats },
      { upsert: false, new: true, setDefaultsOnInsert: true }
    );

    console.log("CMC stats updated:", updatedStats._id);

    console.log("--- Saved to DB ---");
  } catch (err) {
    console.error("❌ Error fetching Data:", err.message);
  }
}

exports.initializeJob = () => {
  cmcStats();
  // new CronJob("0 0 * * *", cmcStats, null, true);
};
