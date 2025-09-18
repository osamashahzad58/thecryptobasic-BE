// cmc-stats-job.js
// Full implementation of the CMC stats job, including robust altcoin-season fetching.
// Usage: require and call initializeJob()

const { CronJob } = require("cron");
const axios = require("axios");
const cheerio = require("cheerio");
const configs = require("../configs");
const CmcStats = require("../src/cmc-coins/models/cmc-stats.model");

// ---------- 1. Fetch CMC Global ----------
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

// ---------- 2. Fetch Fear & Greed ----------
async function fetchFearGreed() {
  try {
    const res = await axios.get("https://api.alternative.me/fng/?limit=30", {
      timeout: 10000,
    });
    const data = res.data?.data || [];

    const now = data[0] || {};
    const yesterday = data[1] || {};
    const lastMonth = data[29] || {};

    return {
      now: {
        value: parseInt(now.value, 10) || 0,
        classification: now.value_classification || "Unknown",
      },
      yesterday: {
        value: parseInt(yesterday.value, 10) || 0,
        classification: yesterday.value_classification || "Unknown",
      },
      lastMonth: {
        value: parseInt(lastMonth.value, 10) || 0,
        classification: lastMonth.value_classification || "Unknown",
      },
    };
  } catch (err) {
    console.error("Fear & Greed fetch failed:", err.message);
    return {
      now: { value: 0, classification: "Unknown" },
      yesterday: { value: 0, classification: "Unknown" },
      lastMonth: { value: 0, classification: "Unknown" },
    };
  }
}

// ---------- 3. Fetch Altcoin Season (robust) ----------
async function fetchAltcoinSeason() {
  const fallBackResult = {
    altcoinSeason: 0,
    altcoinSeasonValue: "0/100",
    yesterday: 0,
    lastWeek: 0,
    lastMonth: 0,
    yearlyHigh: 0,
    yearlyHighDate: "",
    yearlyLow: 0,
    yearlyLowDate: "",
  };

  // helper: find number near a label
  function getNumberNearLabel(text, label) {
    const idx = text.toLowerCase().indexOf(label.toLowerCase());
    if (idx === -1) return 0;
    const snippet = text.slice(idx, idx + 200);
    const m = snippet.match(/(\d{1,3})/);
    return m ? parseInt(m[1], 10) : 0;
  }

  // helper: find fraction X/100 in context of "altcoin" or "season"
  function findFractionWithContext(text) {
    const re = /(\d{1,3})\s*\/\s*100/g;
    let match;
    while ((match = re.exec(text))) {
      const start = Math.max(0, match.index - 80);
      const end = Math.min(text.length, match.index + 80);
      const context = text.slice(start, end).toLowerCase();
      if (context.includes("altcoin") || context.includes("season")) {
        return { value: parseInt(match[1], 10), raw: match[0] };
      }
      // fallback: take first found
      return { value: parseInt(match[1], 10), raw: match[0] };
    }
    return null;
  }

  // try known JSON endpoints
  const jsonUrls = [
    "https://www.blockchaincenter.net/en/altcoin-season.json",
    "https://www.blockchaincenter.net/altcoin-season.json",
  ];

  for (const url of jsonUrls) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const d = res.data;
      // Accept valid object with numeric "now" or "current" fields (the endpoint's shape may vary)
      if (
        d &&
        (d.now !== undefined ||
          d.current !== undefined ||
          d.value !== undefined)
      ) {
        const now = Number(d.now ?? d.current ?? d.value ?? 0) || 0;
        const yesterday =
          Number(d.yesterday ?? d.yest ?? d.yestertday ?? 0) || 0;
        const lastweek =
          Number(d.lastweek ?? d.lastWeek ?? d.last_week ?? 0) || 0;
        const lastmonth =
          Number(d.lastmonth ?? d.lastMonth ?? d.last_month ?? 0) || 0;
        const yearlyHigh =
          Number(
            (d.year && d.year.high && d.year.high.value) ?? d.yearly_high ?? 0
          ) || 0;
        const yearlyHighDate =
          (d.year && d.year.high && d.year.high.date) ??
          d.yearly_high_date ??
          "";
        const yearlyLow =
          Number(
            (d.year && d.year.low && d.year.low.value) ?? d.yearly_low ?? 0
          ) || 0;
        const yearlyLowDate =
          (d.year && d.year.low && d.year.low.date) ?? d.yearly_low_date ?? "";

        return {
          altcoinSeason: now,
          altcoinSeasonValue: `${now}/100`,
          yesterday,
          lastWeek: lastweek,
          lastMonth: lastmonth,
          yearlyHigh,
          yearlyHighDate,
          yearlyLow,
          yearlyLowDate,
        };
      }
    } catch (err) {
      // quietly ignore and continue to next strategy
      // console.debug("Altcoin JSON check failed for", url, err.message);
    }
  }

  // Strategy 2: static HTML parsing
  try {
    const pageRes = await axios.get(
      "https://www.blockchaincenter.net/altcoin-season/",
      {
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; altcoin-fetcher/1.0)",
        },
      }
    );

    const $ = cheerio.load(pageRes.data || "");
    const bodyText = $("body").text() || "";

    const frac = findFractionWithContext(bodyText);
    const altcoinSeason = frac ? frac.value : 0;
    const yesterday = getNumberNearLabel(bodyText, "Yesterday");
    const lastWeek = getNumberNearLabel(bodyText, "Last Week");
    const lastMonth = getNumberNearLabel(bodyText, "Last Month");
    const yearlyHigh = getNumberNearLabel(bodyText, "Yearly High");
    const yearlyLow = getNumberNearLabel(bodyText, "Yearly Low");

    function getDateNearLabel(text, label) {
      const idx = text.toLowerCase().indexOf(label.toLowerCase());
      if (idx === -1) return "";
      const snippet = text.slice(Math.max(0, idx - 120), idx + 120);
      const dateMatch = snippet.match(/\b([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})\b/);
      if (dateMatch) return dateMatch[1];
      const alt = snippet.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      return alt ? alt[1] : "";
    }

    const yearlyHighDate = getDateNearLabel(bodyText, "Yearly High");
    const yearlyLowDate = getDateNearLabel(bodyText, "Yearly Low");

    if (
      altcoinSeason !== 0 ||
      yesterday !== 0 ||
      lastWeek !== 0 ||
      lastMonth !== 0 ||
      yearlyHigh !== 0 ||
      yearlyLow !== 0
    ) {
      return {
        altcoinSeason,
        altcoinSeasonValue: `${altcoinSeason}/100`,
        yesterday,
        lastWeek,
        lastMonth,
        yearlyHigh,
        yearlyHighDate,
        yearlyLow,
        yearlyLowDate,
      };
    }
  } catch (err) {
    // continue to Puppeteer fallback
    // console.debug("Altcoin HTML parse failed:", err.message);
  }

  // Strategy 3: Puppeteer fallback (lazy require)
  try {
    let puppeteer;
    try {
      puppeteer = require("puppeteer");
    } catch (e) {
      // puppeteer not installed; skip this strategy
      // console.warn("Puppeteer not installed; skipping headless render fallback.");
      return fallBackResult;
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (compatible; altcoin-fetcher/1.0)");
    await page.goto("https://www.blockchaincenter.net/altcoin-season/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Extract the visible text from the fully rendered page
    const extracted = await page.evaluate(() =>
      document.body ? document.body.innerText : ""
    );
    await browser.close();

    const text = extracted || "";
    const frac = findFractionWithContext(text);
    const altcoinSeason = frac ? frac.value : 0;
    const yesterday = getNumberNearLabel(text, "Yesterday");
    const lastWeek = getNumberNearLabel(text, "Last Week");
    const lastMonth = getNumberNearLabel(text, "Last Month");
    const yearlyHigh = getNumberNearLabel(text, "Yearly High");
    const yearlyLow = getNumberNearLabel(text, "Yearly Low");

    function getDateNearLabelFromText(t, label) {
      const idx = t.toLowerCase().indexOf(label.toLowerCase());
      if (idx === -1) return "";
      const snippet = t.slice(Math.max(0, idx - 120), idx + 120);
      const dateMatch = snippet.match(/\b([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})\b/);
      if (dateMatch) return dateMatch[1];
      const alt = snippet.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      return alt ? alt[1] : "";
    }

    const yearlyHighDate = getDateNearLabelFromText(text, "Yearly High");
    const yearlyLowDate = getDateNearLabelFromText(text, "Yearly Low");

    return {
      altcoinSeason,
      altcoinSeasonValue: `${altcoinSeason}/100`,
      yesterday,
      lastWeek,
      lastMonth,
      yearlyHigh,
      yearlyHighDate,
      yearlyLow,
      yearlyLowDate,
    };
  } catch (err) {
    // If Puppeteer failed for any reason, return fallback
    // console.error("Puppeteer fallback failed:", err.message);
    return fallBackResult;
  }
}

// ---------- 4. Fetch ETH Gas ----------
async function fetchEthGas() {
  try {
    const res = await axios.get(
      "https://ethgasstation.info/api/ethgasAPI.json",
      { timeout: 10000 }
    );
    return res.data && res.data.average ? res.data.average / 10 : 0;
  } catch (err) {
    console.error("ETH Gas fetch failed:", err.message);
    return 0;
  }
}

// ---------- 5. Fetch CMC100 ----------
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

    let change24h = data?.quotes?.USD?.percent_change_24h;
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

// ---------- 6. Fetch Dominance Data ----------
async function fetchDominanceData(marketDataFromGlobal = {}) {
  try {
    // We will attempt to compute dominance from global data where possible,
    // but also request top listings as a fallback to compute SOL dominance.
    // If you have a global btc_dominance field in marketDataFromGlobal, prefer it.
    let btcDominanceFromGlobal =
      marketDataFromGlobal?.btc_dominance ??
      marketDataFromGlobal?.btc_dominance_percentage ??
      null;
    let ethDominanceFromGlobal =
      marketDataFromGlobal?.eth_dominance ??
      marketDataFromGlobal?.eth_dominance_percentage ??
      null;

    // Fetch top 10 listings to compute SOL dominance fraction relative to top N
    const res = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": configs.coinMarketCap.apiKey },
        params: { start: 1, limit: 10, convert: "USD" },
        timeout: 15000,
      }
    );

    const cryptocurrencies = res.data?.data || [];
    let totalMarketCap = 0;
    let btcMarketCap = 0;
    let solMarketCap = 0;
    let ethMarketCap = 0;

    cryptocurrencies.forEach((crypto) => {
      const marketCap = crypto.quote?.USD?.market_cap || 0;
      totalMarketCap += marketCap;

      if (crypto.symbol === "BTC") btcMarketCap = marketCap;
      if (crypto.symbol === "SOL") solMarketCap = marketCap;
      if (crypto.symbol === "ETH") ethMarketCap = marketCap;
    });

    // If CMC Global provides btc/eth dominance, prefer that for accuracy
    const btcDominance =
      btcDominanceFromGlobal !== null
        ? Number(btcDominanceFromGlobal)
        : totalMarketCap > 0
        ? (btcMarketCap / totalMarketCap) * 100
        : 0;

    const ethDominance =
      ethDominanceFromGlobal !== null
        ? Number(ethDominanceFromGlobal)
        : totalMarketCap > 0
        ? (ethMarketCap / totalMarketCap) * 100
        : 0;

    const solDominance =
      totalMarketCap > 0 ? (solMarketCap / totalMarketCap) * 100 : 0;
    const othersDominance = Math.max(
      0,
      100 - (btcDominance + solDominance + ethDominance)
    );

    return {
      btc_dominance: btcDominance,
      sol_dominance: solDominance,
      others_dominance: othersDominance,
      eth_dominance_from_calc: ethDominance,
    };
  } catch (err) {
    console.error("Dominance data fetch failed:", err.message);
    return {
      btc_dominance: 0,
      sol_dominance: 0,
      others_dominance: 0,
      eth_dominance_from_calc: 0,
    };
  }
}

// ---------- Main job ----------
async function cmcStats() {
  try {
    console.log("\n--- Fetching Stats ---");

    const [
      marketData,
      fearGreed,
      altcoinSeason,
      ethGas,
      cmc100Data,
      dominanceData,
    ] = await Promise.all([
      fetchCMCGlobal(),
      fetchFearGreed(),
      fetchAltcoinSeason(),
      fetchEthGas(),
      fetchCMC100(),
      fetchDominanceData(), // we pass marketData later if you want to prefer global dominance fields
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
      btc_dominance: dominanceData.btc_dominance || 0,
      sol_dominance: dominanceData.sol_dominance || 0,
      others_dominance: dominanceData.others_dominance || 0,
      eth_dominance:
        marketData.eth_dominance ?? dominanceData.eth_dominance_from_calc,
      eth_gas: ethGas || 0,
      fear_greed_now: fearGreed.now.value || 0,
      fear_greed_now_label: fearGreed.now.classification || "Unknown",
      fear_greed_yesterday: fearGreed.yesterday.value || 0,
      fear_greed_yesterday_label:
        fearGreed.yesterday.classification || "Unknown",
      fear_greed_last_month: fearGreed.lastMonth.value || 0,
      fear_greed_last_month_label:
        fearGreed.lastMonth.classification || "Unknown",
      altcoin_season: altcoinSeason.altcoinSeason || 0,
      altcoin_season_value: altcoinSeason.altcoinSeasonValue || "0/100",
      altcoin_yesterday: altcoinSeason.yesterday || 0,
      altcoin_last_week: altcoinSeason.lastWeek || 0,
      altcoin_last_month: altcoinSeason.lastMonth || 0,
      altcoin_yearly_high: altcoinSeason.yearlyHigh || 0,
      altcoin_yearly_high_date: altcoinSeason.yearlyHighDate || "",
      altcoin_yearly_low: altcoinSeason.yearlyLow || 0,
      altcoin_yearly_low_date: altcoinSeason.yearlyLowDate || "",
      cmc100: cmc100Data.cmc100,
      cmc100_change_24h: cmc100Data.cmc100_change_24h,
      timestamp: new Date(),
    };

    console.log("✅ Final Stats:", stats);
    await CmcStats.create(stats);
    console.log("--- Saved to DB ---");
  } catch (err) {
    console.error("❌ Error fetching Data:", err.message);
  }
}

// ---------- Initialize job ----------
exports.initializeJob = () => {
  // run once immediately
  cmcStats();
  // schedule daily at midnight UTC (or change cron expression as needed)
  new CronJob("0 0 * * *", cmcStats, null, true);
};
