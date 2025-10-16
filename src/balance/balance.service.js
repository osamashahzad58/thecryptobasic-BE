// balance.service.js
require("dotenv").config();
const fetch = require("node-fetch");

const Portfolio = require("../portfolio/portfolio.model");
const Balance = require("./balance.model");
const Transaction = require("../transaction/transaction.model");
const coins = require("../cmc-coins/models/cmc-coins.model");
const Coin = require("../cmc-coins/models/cmc-coins.model");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

// --- API Keys ---
const API_KEY_MORALIS = (
  process.env.API_KEY_MORALIS ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImEzOWVhMDU5LWQwNTEtNGNiOS05MTg2LTIxZjBhNDMwNzY1YyIsIm9yZ0lkIjoiNDcwMjM4IiwidXNlcklkIjoiNDgzNzQ2IiwidHlwZUlkIjoiM2RkMzNiNTctZjVlMS00NzE2LWE1NWMtNzAxYzM5NThlODliIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTc1NzE1ODEsImV4cCI6NDkxMzMzMTU4MX0.4pvqmwvn7F4p-mPJt4jQahho771hL0wwQyrDH_ccotk"
).trim();
const ETHERSCAN_API_KEY = (
  process.env.ETHERSCAN_API_KEY || "SCQ7RNBKAFWSB1VRRKA2FM8E2C6MAZFUFZ"
).trim();
const BSCSCAN_API_KEY = (
  process.env.ETHERSCAN_API_KEY || "SCQ7RNBKAFWSB1VRRKA2FM8E2C6MAZFUFZ"
).trim();
const POLYGONSCAN_API_KEY = (process.env.POLYGONSCAN_API_KEY || "").trim();
const SNOWTRACE_API_KEY = (process.env.SNOWTRACE_API_KEY || "").trim();
const ARBISCAN_API_KEY = (process.env.ARBISCAN_API_KEY || "").trim();

// ---------------------------
// Utilities / Chain mapping
// ---------------------------
function chainHexToName(chain) {
  if (!chain) return "eth";
  const c = (chain + "").toLowerCase();
  if (c.startsWith("0x")) {
    const map = {
      "0x1": "eth",
      "0x38": "bsc",
      "0x89": "polygon",
      "0xa86a": "avax", // avalanche
      "0xa4b1": "arbitrum",
    };
    return map[c] || "eth";
  }
  return c;
}

function chainNameToEtherscanChainId(chainName) {
  const name = (chainName || "eth").toLowerCase();
  const map = {
    eth: 1,
    ethereum: 1,
    bsc: 56,
    polygon: 137,
    matic: 137,
    avax: 43114,
    avalanche: 43114,
    arbitrum: 42161,
    arb: 42161,
  };
  return map[name] || 1;
}

const EXPLORER_CONFIG = {
  eth: {
    provider: "etherscan",
    v2Base: "https://api.etherscan.io/v2/api",
    v1Base: "https://api.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
    chainid: 1,
  },
  // bsc: {
  //   provider: "bscscan",
  //   base: "https://api.bscscan.com/api",
  //   apiKey: BSCSCAN_API_KEY || ETHERSCAN_API_KEY,
  // },
  bsc: {
    provider: "etherscan",
    v2Base: "https://api.etherscan.io/v2/api",
    v1Base: "https://api.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
    chainid: 56,
  },

  // polygon: {
  //   provider: "polygonscan",
  //   base: "https://api.polygonscan.com/api",
  //   apiKey: POLYGONSCAN_API_KEY || ETHERSCAN_API_KEY,
  // },
  polygon: {
    provider: "etherscan",
    v2Base: "https://api.etherscan.io/v2/api",
    v1Base: "https://api.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
    chainid: 80001,
  },
  avax: {
    provider: "snowtrace",
    base: "https://api.etherscan.io/v2/api",
    apiKey: SNOWTRACE_API_KEY || ETHERSCAN_API_KEY,
    chainid: 43114,
  },
  arbitrum: {
    provider: "arbiscan",
    base: "https://api.etherscan.io/v2/api",
    apiKey: ARBISCAN_API_KEY || ETHERSCAN_API_KEY,
    chainid: 42161,
  },
};

// safe JSON fetch that defends against HTML responses
async function safeFetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  const ct =
    (res.headers && res.headers.get ? res.headers.get("content-type") : "") ||
    "";
  if (!res.ok) {
    const err = new Error(`${res.status} ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (
    !ct.toLowerCase().includes("application/json") &&
    !text.trim().startsWith("{") &&
    !text.trim().startsWith("[")
  ) {
    const err = new Error(`Non-JSON response: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error(`Invalid JSON: ${text.slice(0, 300)}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
}

// ---------------------------
// Price helper (Moralis primary, fallback map)
// ---------------------------
function fallbackPrice(symbol) {
  const fallback = {
    ETH: 2600,
    BNB: 600,
    MATIC: 0.8,
    AVAX: 25,
    ARB: 0.9,
    USDT: 1,
    USDC: 1,
  };
  return fallback[(symbol || "").toUpperCase()] || 0;
}

async function getTokenPriceUSD(chain, tokenAddress, symbol = "ETH") {
  try {
    if (!API_KEY_MORALIS) return fallbackPrice(symbol);
    const chainName = chainHexToName(chain);
    const address =
      !tokenAddress || /^eth$/i.test(symbol)
        ? "native"
        : tokenAddress.toLowerCase();
    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${address}/price?chain=${chainName}`;
    const data = await safeFetchJson(url, {
      headers: { accept: "application/json", "X-API-Key": API_KEY_MORALIS },
    }).catch(() => ({}));
    const usd = data?.usdPrice || data?.usd_price || 0;
    if (usd && !isNaN(Number(usd))) return Number(usd);
    return fallbackPrice(symbol);
  } catch (err) {
    console.warn("[getTokenPriceUSD] error:", err.message || err);
    return fallbackPrice(symbol);
  }
}

// Helper to fetch token metadata from DB/Dexscreener (used by multiple functions)
async function fetchTokenMetadata(tokenAddr, defaultSymbol) {
  // Default values
  let name = defaultSymbol;
  let symbol = defaultSymbol;
  let priceUSD = 0;
  let percent_change_1h = 0;
  let percent_change_24h = 0;
  let percent_change_7d = 0;
  let logo = "";
  let coinId = null;

  try {
    // 1. Try to get more accurate data from your CMC table
    // NOTE: Using exact match on tokenAddr instead of $regex for speed if possible
    const coin = await coins.findOne({
      "contracts.contract": tokenAddr.toLowerCase(),
    });

    if (coin) {
      name = coin.name || name;
      symbol = coin.symbol || symbol;
      logo = coin.logo || "";
      coinId = coin.coinId || null;
      priceUSD = Number(coin.price || priceUSD || 0);
      percent_change_1h = Number(coin.percent_change_1h || 0);
      percent_change_24h = Number(coin.percent_change_24h || 0);
      percent_change_7d = Number(coin.percent_change_7d || 0);
    } else {
      // 2. Fallback: Dexscreener API
      try {
        const dsUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddr}`;
        const res = await fetch(dsUrl);
        const dsData = await res.json();

        if (dsData && Array.isArray(dsData.pairs) && dsData.pairs.length > 0) {
          const pair = dsData.pairs[0];
          priceUSD = Number(pair.priceUsd || 0);
          // Dexscreener gives priceChange.h1, h24. No h7d.
          percent_change_1h = Number(pair.priceChange?.h1 || 0);
          percent_change_24h = Number(pair.priceChange?.h24 || 0);
          logo = pair.info?.imageUrl || "";
        }
      } catch (dsErr) {
        // console.warn(`[Dexscreener] error for ${tokenAddr}:`, dsErr.message);
      }
    }
  } catch (err) {
    console.warn(`[CMC-Coins] lookup failed for ${tokenAddr}:`, err.message);
  }

  return {
    name,
    symbol,
    logo,
    coinId,
    priceUSD,
    percent_change_1h,
    percent_change_24h,
    percent_change_7d,
  };
}

// ---------------------------
// Moralis token balances (primary)
// ---------------------------
async function getWalletTokensMoralis(walletAddress, chain) {
  try {
    if (!API_KEY_MORALIS) {
      console.warn(
        "[getWalletTokensMoralis] no moralis key provided, skipping"
      );
      return [];
    }

    const chainName = chainHexToName(chain);
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/tokens?chain=${chainName}`;

    console.log("🌐 [MORALIS] Fetching tokens:", url);

    const data = await safeFetchJson(url, {
      headers: {
        accept: "application/json",
        "X-API-Key": API_KEY_MORALIS,
      },
    });

    const arr = Array.isArray(data?.result)
      ? data.result
      : Array.isArray(data)
      ? data
      : [];

    if (!Array.isArray(arr)) {
      console.warn(
        "[getWalletTokensMoralis] unexpected response shape:",
        typeof data,
        data && Object.keys(data)
      );
      return [];
    }

    // --- PERFORMANCE FIX: Use Promise.all to fetch metadata concurrently ---
    const tokenPromises = arr.map(async (t) => {
      if (
        !t ||
        !(t.token_address || t.tokenAddress) ||
        t.balance === undefined ||
        isNaN(Number(t.balance))
      ) {
        return null; // Filter out later
      }

      const tokenAddr = (t.token_address || t.tokenAddress || "").toLowerCase();
      const decimals = Number(
        t.decimals || t.token_decimals || t.tokenDecimals || 18
      );
      const balanceRaw = Number(t.balance);
      const balance = decimals ? balanceRaw / 10 ** decimals : balanceRaw;
      const defaultSymbol = t.symbol || t.token_symbol || "";

      const meta = await fetchTokenMetadata(tokenAddr, defaultSymbol);

      const totalValueUSD = isFinite(balance) ? balance * meta.priceUSD : 0;
      const profitLossUSD = totalValueUSD * (meta.percent_change_24h / 100);

      return {
        tokenAddress: tokenAddr,
        coinId: meta.coinId,
        name: meta.name || t.name || t.token_name || "",
        symbol: meta.symbol,
        logo: meta.logo,
        balance: isFinite(balance) ? balance : 0,
        priceUSD: meta.priceUSD,
        totalValueUSD,
        percent_change_1h: meta.percent_change_1h,
        percent_change_24h: meta.percent_change_24h,
        percent_change_7d: meta.percent_change_7d,
        profitLossUSD,
      };
    });

    const mapped = (await Promise.all(tokenPromises)).filter((t) => t !== null);

    console.log(`[MORALIS] Processed tokens: ${mapped.length}`);
    return mapped;
  } catch (err) {
    console.warn("[getWalletTokensMoralis] fetch error:", err.message || err);
    return [];
  }
}

// ---------------------------
// Explorer transfer fetch (multichain, paginated)
// ---------------------------
// Returns Etherscan-like transfer objects array (raw explorer result items)
async function fetchExplorerTokenTransfersPaginated(
  walletAddress,
  chainName,
  pageSize = 100,
  maxPages = 5
) {
  const cn = (chainName || "eth").toLowerCase();
  const cfg = EXPLORER_CONFIG[cn] || EXPLORER_CONFIG.eth;

  // prefer Etherscan V2 unified endpoint if we have an Etherscan key (covers many chains)
  if (cfg.provider === "etherscan" && ETHERSCAN_API_KEY) {
    const chainid = chainNameToEtherscanChainId(cn);
    let all = [];
    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        chainid: String(chainid),
        module: "account",
        action: "tokentx",
        address: walletAddress,
        page: String(page),
        offset: String(pageSize),
        sort: "desc",
        apikey: ETHERSCAN_API_KEY,
      });
      const url = `${cfg.v2Base}?${params.toString()}`;
      console.log(`[Etherscan V2] Fetch page ${page} -> ${url}`);
      try {
        const data = await safeFetchJson(url);
        if (!data || !Array.isArray(data.result)) {
          console.warn(
            "[Etherscan V2] unexpected response",
            data && (data.message || data.status)
          );
          break;
        }
        if (!data.result.length) break;
        all = all.concat(data.result);
        if (data.result.length < pageSize) break;
      } catch (err) {
        console.warn(
          "[Etherscan V2] page fetch error:",
          err.message || err.body || err
        );
        break;
      }
    }
    return all;
  }

  // otherwise fall back to chain-specific explorer (v1-style API)
  if (cfg.base) {
    const apiKey = cfg.apiKey || ETHERSCAN_API_KEY;
    let all = [];
    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        module: "account",
        action: "tokentx",
        address: walletAddress,
        page: String(page),
        offset: String(pageSize),
        sort: "desc",
      });
      if (apiKey) params.set("apikey", apiKey);
      const url = `${cfg.base}?${params.toString()}`;
      console.log(`[Explorer:${cfg.provider}] Fetch page ${page} -> ${url}`);
      try {
        const data = await safeFetchJson(url);
        // many explorers return { status: "1", message: "OK", result: [...] }
        if (!data || !Array.isArray(data.result)) {
          console.warn(
            `[Explorer:${cfg.provider}] unexpected response`,
            data && (data.message || data.status)
          );
          break;
        }
        if (!data.result.length) break;
        all = all.concat(data.result);
        if (data.result.length < pageSize) break;
      } catch (err) {
        console.warn(
          `[Explorer:${cfg.provider}] page fetch error:`,
          err.message || err.body || err
        );
        break;
      }
    }
    return all;
  }

  // default empty
  return [];
}

// Convert explorer transfer rows into your pipeline shape
function convertExplorerTransfersToPipelineShape(explorerRows) {
  return explorerRows.map((t) => {
    // possible fields across explorers/v2: from, to, contractAddress, tokenSymbol, tokenDecimal, value, hash, timeStamp
    return {
      from_address: (t.from || t.from_address || "").toLowerCase(),
      to_address: (t.to || t.to_address || "").toLowerCase(),
      token_symbol: t.tokenSymbol || t.token_symbol || t.tokenSymbol || "",
      token_decimals:
        t.tokenDecimal || t.token_decimal || t.tokenDecimals || 18,
      value: t.value,
      transaction_hash:
        t.hash || t.txhash || t.transactionHash || t.transaction_hash,
      token_address: (
        t.contractAddress ||
        t.contract_address ||
        t.contract ||
        ""
      ).toLowerCase(),
      block_timestamp:
        t.timeStamp || t.timeStamp || t.timeStamp === 0
          ? new Date(
              Number(t.timeStamp) *
                (String(t.timeStamp).length === 10 ? 1000 : 1)
            ).toISOString()
          : t.timeStamp || t.block_timestamp || new Date().toISOString(),
    };
  });
}

// derive token balances from transfer rows (works with explorer results or your Etherscan mapped shape)
async function deriveTokenBalancesFromTransfers(transfers, walletLower) {
  const map = new Map();

  // Step 1: Aggregate token balances (Synchronous, this is fast)
  for (const t of transfers) {
    const contract = (t.contractAddress || t.token_address || "").toLowerCase();
    const symbol = t.tokenSymbol || t.token_symbol || "";
    const decimals = Number(t.tokenDecimal || t.token_decimal || 18);
    const val = Number(t.value || 0);
    if (!contract || !val) continue;

    const key = `${contract}|${symbol}|${decimals}`;
    const entry = map.get(key) || { contract, symbol, decimals, net: 0 };

    if ((t.to || "").toLowerCase() === walletLower) entry.net += val;
    else if ((t.from || "").toLowerCase() === walletLower) entry.net -= val;

    map.set(key, entry);
  }

  // Step 2: Build token details (Async part)
  const mapValues = Array.from(map.values());

  // --- PERFORMANCE FIX: Use Promise.all to fetch metadata concurrently ---
  const tokenPromises = mapValues.map(async (v) => {
    const quantity = v.net / 10 ** Number(v.decimals || 18);
    if (!isFinite(quantity) || quantity === 0) return null; // Filter out later

    const meta = await fetchTokenMetadata(v.contract, v.symbol);

    const totalValueUSD = isFinite(meta.priceUSD)
      ? quantity * meta.priceUSD
      : 0;
    const pl = totalValueUSD * (meta.percent_change_24h / 100);

    return {
      tokenAddress: v.contract,
      coinId: meta.coinId,
      name: meta.name,
      symbol: v.symbol,
      logo: meta.logo,
      balance: quantity,
      priceUSD: meta.priceUSD,
      totalValueUSD,
      percent_change_1h: meta.percent_change_1h,
      percent_change_24h: meta.percent_change_24h,
      percent_change_7d: meta.percent_change_7d,
      profitLossUSD: pl,
    };
  });

  const tokens = (await Promise.all(tokenPromises)).filter((t) => t !== null);

  return tokens;
}

// ---------------------------
// Transfers: try Moralis then multi-explorer fallback (paginated)
// ---------------------------
async function fetchTransfers(walletAddress, chain) {
  const chainName = chainHexToName(chain);
  const walletLower = walletAddress.toLowerCase();

  // First: try Moralis transfers if key is present
  if (API_KEY_MORALIS) {
    const candidates = [
      {
        method: "GET",
        url: `https://deep-index.moralis.io/api/v2.2/${walletAddress}/erc20/transfers?chain=${chainName}&limit=500&order=desc`, // Increased limit
      },
      {
        method: "GET",
        url: `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/erc20/transfers?chain=${chainName}&limit=500&order=desc`, // Increased limit
      },
      // Removed POST candidate for simplicity unless necessary
    ];
    for (const c of candidates) {
      try {
        console.log(`[Transfers] Trying Moralis ${c.method} ${c.url}`);
        const headers = {
          accept: "application/json",
          "X-API-Key": API_KEY_MORALIS,
          ...(c.extraHeaders || {}),
        };
        const opts = { method: c.method, headers };
        if (c.method === "POST" && c.body) opts.body = c.body;
        const data = await safeFetchJson(c.url, opts);

        // Moralis sometimes wraps results in a 'result' key, or is a direct array
        const result = Array.isArray(data.result)
          ? data.result
          : Array.isArray(data)
          ? data
          : [];

        if (result.length > 0) {
          console.log(
            `[Transfers] Moralis success with ${result.length} transfers.`
          );
          return result;
        }

        console.warn(
          "[Transfers] Moralis candidate returned no transfers, trying next"
        );
      } catch (err) {
        console.warn(
          "[Transfers] Moralis candidate failed:",
          err.message || err.body || err
        );
        if (
          err.status === 401 ||
          (err.body && String(err.body).includes("Token is invalid format"))
        ) {
          console.warn(
            "[Transfers] Moralis key invalid. Falling back to explorers."
          );
          break;
        }
      }
    }
  } else {
    console.log(
      "[Transfers] No Moralis key configured, using explorers fallback"
    );
  }

  // Explorer fallback (paginated)
  const explorerRaw = await fetchExplorerTokenTransfersPaginated(
    walletAddress,
    chainName,
    100,
    6
  );
  if (!explorerRaw || !explorerRaw.length) return [];

  // If these are raw explorer rows, convert into pipeline shape
  const pipelineRows = convertExplorerTransfersToPipelineShape(explorerRaw);
  return pipelineRows;
}

// ---------------------------
// find or create portfolio (unchanged)
// ---------------------------
// async function findOrCreatePortfolio(walletAddress, userId) {
//   const lower = walletAddress.toLowerCase();

//   // Optimized: Try to find existing portfolio first
//   let portfolio = await Portfolio.findOne({
//     walletAddress: lower,
//     userId: new mongoose.Types.ObjectId(userId),
//   });

//   if (portfolio) {
//     console.log("📁 Found existing portfolio:", portfolio._id);
//     return portfolio;
//   }

//   // Create if not found
//   portfolio = await Portfolio.create({
//     walletAddress: lower,
//     isBlockchain: true,
//     userId: new mongoose.Types.ObjectId(userId),
//     name: name,
//     chainName: "eth",
//   });
//   console.log("📁 Created new portfolio:", portfolio);

//   return portfolio;
// }

// Helper to fetch metadata for a single transaction (used in exports.create)
async function getTransactionTokenMeta(tokenAddress, symbol, chainName) {
  let tokenMeta = { name: symbol, symbol: symbol, logo: "", priceUSD: 0 };
  const addressLower = tokenAddress?.toLowerCase();

  if (!addressLower) {
    tokenMeta.priceUSD = await getTokenPriceUSD(chainName, null, symbol); // Fallback for native token
    return tokenMeta;
  }

  try {
    // 1. Check your Coin (CMC) table (most reliable and fast DB lookup)
    const coin = await Coin.findOne({
      "contracts.contract": addressLower,
    });

    if (coin) {
      tokenMeta.name = coin.name || symbol;
      tokenMeta.symbol = coin.symbol || symbol;
      tokenMeta.logo = coin.logo || "";
      tokenMeta.priceUSD = coin.price || 0;
    } else {
      // 2. Fallback: Dexscreener API (external API call)
      try {
        const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${addressLower}`;
        const res = await fetch(dexUrl);
        const data = await res.json();
        if (data?.pairs?.length > 0) {
          const pair = data.pairs[0];
          tokenMeta.name = pair.baseToken?.name || symbol;
          tokenMeta.symbol = pair.baseToken?.symbol || symbol;
          tokenMeta.logo = pair.info?.imageUrl || "";
          tokenMeta.priceUSD = parseFloat(pair.priceUsd) || 0;
        }
      } catch (e) {
        // console.warn(`[Dexscreener fallback failed for ${symbol}]`, e.message);
      }
    }
  } catch (metaErr) {
    console.warn(`[Token Meta Fetch Error for ${symbol}]`, metaErr.message);
  }

  // 3. Final price check via Moralis if no price found
  const pricePerCoin =
    tokenMeta.priceUSD > 0
      ? tokenMeta.priceUSD
      : await getTokenPriceUSD(chainName, tokenAddress, symbol);

  tokenMeta.priceUSD = pricePerCoin;

  return tokenMeta;
}

// ---------------------------
// Main: create handler (Refactored for concurrency)
// ---------------------------
exports.create = async (createDto, result = {}) => {
  try {
    console.log("🔥 [Balance.create] Incoming request:", createDto);
    const {
      walletAddress,
      chain = "eth",
      userId,
      name,
      isMe,
    } = createDto || {};

    if (!walletAddress) throw new Error("walletAddress is required");
    if (!userId) throw new Error("userId is required");

    const chainName = chainHexToName(chain);

    // --- STEP 1: Concurrently fetch tokens, transfers, and portfolio ---
    // Fetching tokens and transfers are independent, so run them in parallel
    const [tokensFromMoralis, transfers] = await Promise.all([
      getWalletTokensMoralis(walletAddress, chainName),
      fetchTransfers(walletAddress, chainName),
    ]);

    let tokens = tokensFromMoralis;

    // Fallback logic for tokens (only if Moralis failed to return tokens)
    if (!tokens.length) {
      console.log(
        `[Fallback] deriving tokens from explorer token transfers for chain ${chainName}`
      );
      const explorerRaw = await fetchExplorerTokenTransfersPaginated(
        walletAddress,
        chainName,
        100,
        6
      );
      const derived = await deriveTokenBalancesFromTransfers(
        explorerRaw,
        walletAddress.toLowerCase()
      );
      tokens = derived;
      console.log(`[Fallback] Derived ${tokens.length} token balances`);
    }

    // --- STEP 2: Handle Portfolio and Balance Doc ---
    // const portfolio = await findOrCreatePortfolio(walletAddress, userId);
    // Optimized: Try to find existing portfolio first
    let portfolio = await Portfolio.findOne({
      walletAddress: walletAddress,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (portfolio) {
      console.log("📁 Found existing portfolio:", portfolio._id);
      return portfolio;
    }

    // Create if not found
    portfolio = await Portfolio.create({
      walletAddress: walletAddress,
      isBlockchain: true,
      userId: new mongoose.Types.ObjectId(userId),
      name: name,
      chainName: chainName,
      isMe: typeof isMe === "boolean" ? isMe : false, // ✅ default false
    });

    const updateData = {
      walletAddress: walletAddress.toLowerCase(),
      tokens: Array.isArray(tokens) ? tokens : [],
      ...(name && { name }),
      isMe: typeof isMe === "boolean" ? isMe : false, // ✅ default false
      userId: new mongoose.Types.ObjectId(userId),
      portfolioId: new mongoose.Types.ObjectId(portfolio._id),
      chainName: chainName,
      isBlockchain: true,
    };
    const walletLower = walletAddress.toLowerCase();

    // const walletDoc = await Balance.create(updateData);

    const walletDoc = await Balance.findOneAndUpdate(
      { walletAddress: walletLower, userId }, // Query filter
      { $set: updateData }, // Update operation
      { upsert: true, new: true, setDefaultsOnInsert: true } // Options
    );

    console.log("💾 [Balance] Wallet saved:", walletDoc.walletAddress);

    // --- STEP 3: Process & Insert Transactions (Concurrency FTW) ---
    console.log(`📦 Total transfers available: ${transfers.length}`);
    const chainId = new mongoose.Types.ObjectId(userId);
    const portfolioId = new mongoose.Types.ObjectId(portfolio._id);
    let address;
    // Create an array of promises for transactions
    const txPromises = transfers.map(async (tx) => {
      const from = (tx.from_address || "").toLowerCase();
      const to = (tx.to_address || "").toLowerCase();
      if (!from || !to || from === to) return null;
      address = from;
      const direction =
        from === walletLower ? "out" : to === walletLower ? "in" : null;
      if (!direction) return null;

      const symbol =
        tx.token_symbol || tx.tokenSymbol || tx.token_symbol || "UNKNOWN";
      const decimals = Number(tx.token_decimals || tx.tokenDecimals || 18);
      const value = Number(tx.value || 0);
      const quantity = decimals ? value / 10 ** decimals : value;
      if (!quantity || isNaN(quantity) || quantity <= 0) return null;

      const hash = tx.transaction_hash || tx.transactionHash || tx.hash;
      if (!hash) return null;

      const tokenAddress = tx.token_address || tx.address || null;

      // Get token metadata and final price (the slow part, now in parallel)
      const tokenMeta = await getTransactionTokenMeta(
        tokenAddress,
        symbol,
        chainName
      );

      return {
        userId: chainId,
        coinId: tokenMeta.symbol, // Use the resolved symbol
        name: tokenMeta.name,
        symbol: tokenMeta.symbol,
        logo: tokenMeta.logo,
        type: "transfer",
        transferDirection: direction,
        transactionTime: new Date(
          tx.block_timestamp || tx.blockTimestamp || Date.now()
        ),
        quantity,
        fee: 0,
        pricePerCoin: tokenMeta.priceUSD, // Use the resolved price
        totalSpent: 0,
        totalReceived: 0,
        note: address,
        walletAddress: address,
        portfolioId: portfolioId,
        chainName: chainName,
      };
    });

    // Execute all transaction lookups concurrently
    const txs = (await Promise.all(txPromises)).filter((t) => t !== null);

    console.log(`📊 Prepared ${txs.length} transactions for DB insert`);
    if (txs.length) {
      console.log("🧩 Sample tx:", JSON.stringify(txs[0], null, 2));
      const inserted = await Transaction.insertMany(txs, {
        ordered: false,
      }).catch((err) => {
        // Suppress 'duplicate key' errors which are expected in unordered insert
        if (!err.message || !err.message.includes("duplicate key")) {
          console.warn(
            "[insertMany] partial insert error:",
            err.message || err
          );
        }
        return err?.insertedDocs || [];
      });
      console.log(
        `✅ Inserted ${
          Array.isArray(inserted) ? inserted.length : 0
        } transactions`
      );
    } else {
      console.log("⚠️ No new transactions to insert");
    }

    result.data = walletDoc;
    result.message = "Done";
  } catch (err) {
    console.error("[create] Error:", err.message || err);
    result.ex = err.message || err;
  } finally {
    return result;
  }
};
////////////////////////////////////////////////////////////////////////////

exports.allAsset = async (byUserIdDto, result = {}) => {
  try {
    const { userId, offset, limit } = byUserIdDto;
    console.log(byUserIdDto, "byUserIdDto");

    if (!userId) {
      result.ex = new Error("Missing userId");
      return result;
    }

    const wallet = await Balance.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    result.data = wallet;
  } catch (ex) {
    console.error("[allAsset] Error (balance-based):", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getList = async (getListDto, result = {}) => {
  try {
    const { userId } = getListDto;

    if (!userId) {
      result.ex = new Error("userId is required");
      return result;
    }

    // Fetch all balances for this user
    const balances = await Balance.find({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // If no balances found
    if (!balances || balances.length === 0) {
      result.data = [];
      result.message = "No wallet balances found";
      return result;
    }

    // Map each wallet with its total USD value
    const data = balances.map((wallet) => {
      const totalValueUSD = wallet.tokens.reduce(
        (sum, token) => sum + (token.totalValueUSD || 0),
        0
      );

      return {
        _id: wallet._id,
        name: wallet.name,
        walletAddress: wallet.walletAddress,
        isMe: wallet.isMe,
        totalValueUSD: Number(totalValueUSD.toFixed(2)),
        tokenCount: wallet.tokens.length,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      };
    });

    // Optional: total portfolio value across all wallets
    const portfolioTotalUSD = data.reduce((sum, w) => sum + w.totalValueUSD, 0);

    result.data = {
      totalWallets: data.length,
      portfolioTotalUSD: Number(portfolioTotalUSD.toFixed(2)),
      wallets: data,
    };
  } catch (ex) {
    console.error("[Balance.getList] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
exports.getCombinePortfolio = async (getListDto, result = {}) => {
  try {
    const { userId } = getListDto;
    if (!userId) {
      result.ex = new Error("userId is required");
      return result;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1) fetch balances and portfolios (lean for performance)
    // const balances = await Balance.find({ userId: userObjectId }).lean();
    const portfolios = await Portfolio.find({ userId: userObjectId }).lean();

    // prepare set of portfolio addresses (lowercased, non-empty)
    const portfolioAddresses = new Set(
      portfolios
        .map((p) => (p.walletAddress || "").toLowerCase())
        .filter(Boolean)
    );

    // 2) build portfolioData (transactions + holdings -> totalValue)
    let portfolioData = [];
    if (portfolios.length) {
      const portfolioIds = portfolios.map((p) => p._id);
      const transactions = await Transaction.find({
        portfolioId: { $in: portfolioIds },
      }).lean();

      const coinIds = [
        ...new Set(transactions.map((t) => t.coinId).filter(Boolean)),
      ];
      const coinDocs = await Coin.find({
        $or: [{ coinId: { $in: coinIds } }, { symbol: { $in: coinIds } }],
      }).lean();

      const coinMap = {};
      for (const c of coinDocs) {
        if (c.coinId) coinMap[c.coinId] = c;
        if (c.symbol) coinMap[c.symbol] = c;
      }

      const transactionsByPortfolio = {};
      const portfolioHoldings = {};

      for (const tx of transactions) {
        const pid = String(tx.portfolioId);
        transactionsByPortfolio[pid] = transactionsByPortfolio[pid] || [];
        portfolioHoldings[pid] = portfolioHoldings[pid] || {};

        const coinId = tx.coinId || tx.symbol;
        transactionsByPortfolio[pid].push({
          ...tx,
          coinInfo: (() => {
            const info = coinMap[tx.coinId] || coinMap[tx.symbol] || {};
            return {
              coinId: info.coinId || coinId,
              logo: info.logo || null,
              price: info.price || 0,
              market_cap: info.market_cap || 0,
              percent_change_7d: info.percent_change_7d || 0,
              percent_change_24h: info.percent_change_24h || 0,
              percent_change_1h: info.percent_change_1h || 0,
              volume_change_24h: info.volume_change_24h || 0,
            };
          })(),
        });

        const currentQty = portfolioHoldings[pid][coinId] || 0;
        if (tx.type === "buy")
          portfolioHoldings[pid][coinId] = currentQty + (tx.quantity || 0);
        else if (tx.type === "sell")
          portfolioHoldings[pid][coinId] = currentQty - (tx.quantity || 0);
        else if (tx.type === "transfer") {
          if (tx.transferDirection === "in")
            portfolioHoldings[pid][coinId] = currentQty + (tx.quantity || 0);
          else if (tx.transferDirection === "out")
            portfolioHoldings[pid][coinId] = currentQty - (tx.quantity || 0);
        }
      }

      portfolioData = portfolios.map((p) => {
        const pid = String(p._id);
        const holdings = portfolioHoldings[pid] || {};
        let totalValue = 0;
        for (const [coinId, qty] of Object.entries(holdings)) {
          const coin =
            coinMap[coinId] ||
            coinMap[coinId.toUpperCase?.() || ""] ||
            coinMap[coinId.toLowerCase?.() || ""];
          if (coin && coin.price && qty > 0) totalValue += qty * coin.price;
        }
        return {
          ...p,
          totalValue: Number(totalValue.toFixed(2)),
          transactions: transactionsByPortfolio[pid] || [],
        };
      });
    }

    // 3) wallet entries from balances
    // const walletDataFromBalances = balances.map((w) => {
    //   const totalValueUSD = (w.tokens || []).reduce(
    //     (sum, t) => sum + (Number(t.totalValueUSD) || 0),
    //     0
    //   );
    //   return {
    //     _id: w._id,
    //     name: w.name,
    //     walletAddress: w.walletAddress || null,
    //     isMe: w.isMe,
    //     isBlockchain: w.isBlockchain,
    //     userId: w.userId,
    //     totalValueUSD: Number(totalValueUSD.toFixed(2)),
    //     tokenCount: (w.tokens || []).length,
    //     createdAt: w.createdAt,
    //     updatedAt: w.updatedAt,
    //     source: "balance",
    //   };
    // });

    // 4) wallet entries from portfolios that don't duplicate balance addresses
    // const existingAddresses = new Set(
    //   walletDataFromBalances
    //     .map((w) => (w.walletAddress || "").toLowerCase())
    //     .filter(Boolean)
    // );
    const walletDataFromPortfolios = portfolioData
      .map((p) => ({
        _id: p._id,
        name: p.name || p.url || `Portfolio-${String(p._id).slice(-6)}`,
        walletAddress: p.walletAddress || null,
        isMe: p.isMe,
        isBlockchain: p.isBlockchain,
        userId: p.userId,
        totalValueUSD: Number((p.totalValue || 0).toFixed(2)),
        tokenCount: (p.transactions || []).length,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        source: "portfolio",
      }))
      .filter((p) => {
        const a = (p.walletAddress || "").toLowerCase();
        return !a || !existingAddresses.has(a); // keep no-address portfolios; skip duplicate addresses
      });

    const walletData = [...walletDataFromPortfolios];

    // 5) classification rules:
    // - explicit isMe true => myWallets
    // - explicit isMe false => otherWallets
    // - undefined isMe => fallback: portfolioAddresses or same userId => myWallets, otherwise otherWallets

    function isTrueish(v) {
      if (v === true) return true;
      if (typeof v === "string") return v.toLowerCase() === "true";
      return false;
    }
    function isFalseish(v) {
      if (v === false) return true;
      if (typeof v === "string") return v.toLowerCase() === "false";
      return false;
    }

    const myWallets = [];
    const otherWallets = [];

    for (const w of walletData) {
      const addr = (w.walletAddress || "").toLowerCase();
      // explicit checks first
      if (isTrueish(w.isMe)) {
        myWallets.push(w);
        continue;
      }
      if (isFalseish(w.isMe)) {
        otherWallets.push(w);
        continue;
      }
      // fallback when isMe undefined/null
      if (addr && portfolioAddresses.has(addr)) {
        myWallets.push(w);
        continue;
      }
      if (!w.walletAddress && String(w.userId || "") === String(userObjectId)) {
        myWallets.push(w);
        continue;
      }
      // default
      otherWallets.push(w);
    }

    const myWalletTotal = myWallets.reduce(
      (s, x) => s + (x.totalValueUSD || 0),
      0
    );
    const otherWalletTotal = otherWallets.reduce(
      (s, x) => s + (x.totalValueUSD || 0),
      0
    );
    const totalPortfolioValue = portfolioData.reduce(
      (s, p) => s + (p.totalValue || 0),
      0
    );

    result.data = {
      totalMyWallets: myWallets.length,
      totalOtherWallets: otherWallets.length,
      totalPortfolios: portfolioData.length,
      myWalletTotalUSD: Number(myWalletTotal.toFixed(2)),
      otherWalletTotalUSD: Number(otherWalletTotal.toFixed(2)),
      portfolioTotalUSD: Number(totalPortfolioValue.toFixed(2)),
      grandTotalUSD: Number(
        (myWalletTotal + otherWalletTotal + totalPortfolioValue).toFixed(2)
      ),
      myWallets,
      otherWallets,
      portfolios: portfolioData,
    };
  } catch (ex) {
    console.error("[getCombinePortfolio] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.getByBalance = async ({ id }, result = {}) => {
  try {
    const data = await Balance.findById(id).lean();
    result.data = data;
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
// Helper: safe ObjectId
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

exports.balanceStats = async (statsDto, result = {}) => {
  try {
    const { userId, portfolioId, timeFilter } = statsDto || {};
    console.log(statsDto, "statsDto");
    // validation
    if (!userId) {
      result.ex = "userId is required";
      return result;
    }
    const userOid = toObjectId(userId);
    if (!userOid) {
      result.ex = "Invalid userId";
      return result;
    }

    const filter = { userId: userOid };
    if (portfolioId) {
      const pOid = toObjectId(portfolioId);
      if (!pOid) {
        result.ex = "Invalid portfolioId";
        return result;
      }
      filter.portfolioId = pOid;
    }

    // fetch balances (wallets) for this user (+ optional portfolio)
    const balances = await Balance.find(filter).lean();
    if (!balances || balances.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        distribution: [],
        topTokens: [],
        assetsChart: [],
        diversimeter: { hhi: 0, level: "None" },
        portfolioHealth: { score: 0, label: "None" },
      };
      return result;
    }

    // flatten tokens
    const tokens = balances.flatMap((b) => b.tokens || []);
    if (!tokens || tokens.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        distribution: [],
        topTokens: [],
        assetsChart: [],
        diversimeter: { hhi: 0, level: "None" },
        portfolioHealth: { score: 0, label: "None" },
      };
      return result;
    }

    // aggregate tokens by coinId -> symbol -> tokenAddress
    const map = new Map();
    for (const t of tokens) {
      const key = t.coinId || t.symbol || t.tokenAddress;
      const balanceNum = Number(t.balance || 0);
      const priceNum = Number(t.priceUSD || 0);
      const totalFromFields = Number(t.totalValueUSD ?? balanceNum * priceNum);
      const value = Number.isFinite(totalFromFields) ? totalFromFields : 0;
      const pct24 = Number(t.percent_change_24h || 0);

      if (!map.has(key)) {
        map.set(key, {
          key,
          coinId: t.coinId || null,
          name: t.name || t.symbol || key,
          symbol: t.symbol || null,
          logo: t.logo || null,
          value,
          percent_change_24h: pct24,
        });
      } else {
        const existing = map.get(key);
        // preserve previousValue to compute weighted pct properly
        const prevValue = existing.value;
        existing.value = prevValue + value;
        // weighted average percent_change_24h
        existing.percent_change_24h =
          existing.value > 0
            ? (existing.percent_change_24h * prevValue + pct24 * value) /
              existing.value
            : 0;
        map.set(key, existing);
      }
    }

    const distribution = Array.from(map.values());

    // compute totals
    let totalValue = 0;
    let totalChange24h = 0;
    for (const d of distribution) {
      totalValue += d.value;
      totalChange24h += d.value * ((d.percent_change_24h || 0) / 100);
    }

    // compute pct and round values
    distribution.forEach((d) => {
      d.pct = totalValue
        ? Number(((d.value / totalValue) * 100).toFixed(2))
        : 0;
      // round value and percent_change_24h for output
      // value could be very large, keep reasonable precision
      d.value = Number(d.value.toFixed(8));
      d.percent_change_24h = Number(
        Number(d.percent_change_24h || 0).toFixed(4)
      );
    });

    const topTokens = [...distribution]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // assetsChart placeholder (no historical snapshots available)
    const days = Number(timeFilter) || 7;
    const assetsChart = [];
    for (let i = days - 1; i >= 0; i--) {
      assetsChart.push({
        dateOffsetDays: i,
        value: Number(totalValue.toFixed(2)),
      });
    }

    // HHI diversification (using pct as percentage points)
    const hhi = distribution.reduce((acc, d) => acc + Math.pow(d.pct, 2), 0);
    const diversimeter = {
      hhi: Number(hhi.toFixed(2)),
      level: hhi < 1500 ? "Low Risk" : hhi < 3000 ? "Medium Risk" : "High Risk",
    };

    const portfolioHealth = {
      score: Math.min(100, Math.round(totalValue / 1_000_000)),
      label:
        totalValue < 50_000 ? "Low" : totalValue < 100_000 ? "Neutral" : "Good",
    };

    const totalChange24hPct = totalValue
      ? (totalChange24h / Math.max(1, totalValue - totalChange24h)) * 100
      : 0;

    result.data = {
      totalValue: Number(totalValue.toFixed(2)),
      totalChange24h: Number(totalChange24h.toFixed(2)),
      totalChange24hPct: Number(totalChange24hPct.toFixed(2)),
      distribution,
      topTokens,
      assetsChart,
      diversimeter,
      portfolioHealth,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};

exports.chartBalance = async (chartDto, result = {}) => {
  try {
    const { userId, portfolioId, walletAddress, timeFilter } = chartDto || {};

    if (!userId) {
      result.ex = "userId is required";
      return result;
    }

    const userOid = toObjectId(userId);
    if (!userOid) {
      result.ex = "Invalid userId";
      return result;
    }

    // 1) Resolve single portfolio: requested -> isMe -> first
    let portfolio = null;
    if (portfolioId) {
      const pOid = toObjectId(portfolioId);
      if (pOid) {
        portfolio = await Portfolio.findOne({
          _id: pOid,
          userId: userOid,
        }).lean();
      }
    }
    if (!portfolio)
      portfolio = await Portfolio.findOne({
        userId: userOid,
        isMe: true,
      }).lean();
    if (!portfolio)
      portfolio = await Portfolio.findOne({ userId: userOid }).lean();

    if (!portfolio) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 2) Fetch balances (wallets) for that portfolio (optionally filter by walletAddress)
    const balFilter = { userId: userOid, portfolioId: portfolio._id };
    if (walletAddress)
      balFilter.walletAddress = String(walletAddress).toLowerCase();

    const balances = await Balance.find(balFilter).lean();
    if (!balances || balances.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 3) Flatten tokens and attach wallet updatedAt as fallback time
    const tokensWithWalletTime = balances.flatMap((b) =>
      (b.tokens || []).map((t) => ({
        ...t,
        _walletUpdatedAt: b.updatedAt || b.createdAt || null,
      }))
    );

    if (!tokensWithWalletTime || tokensWithWalletTime.length === 0) {
      result.data = {
        totalValue: 0,
        totalChange24h: 0,
        totalChange24hPct: 0,
        assetsChart: [],
      };
      return result;
    }

    // 4) Aggregate tokens by coinId -> symbol -> tokenAddress and determine time
    const map = new Map();
    for (const t of tokensWithWalletTime) {
      const key = t.coinId || t.symbol || t.tokenAddress;
      const balanceNum = Number(t.balance || 0);
      const priceNum = Number(t.priceUSD || 0);
      const totalFromFields = Number(t.totalValueUSD ?? balanceNum * priceNum);
      const value = Number.isFinite(totalFromFields) ? totalFromFields : 0;
      const pct24 = Number(t.percent_change_24h || 0);

      // Determine time: prefer token._id timestamp, otherwise wallet updatedAt fallback
      let timeIso = null;
      if (t._id && typeof t._id.getTimestamp === "function") {
        try {
          timeIso = t._id.getTimestamp().toISOString();
        } catch (e) {
          timeIso = null;
        }
      }
      if (!timeIso && t._walletUpdatedAt) {
        try {
          timeIso = new Date(t._walletUpdatedAt).toISOString();
        } catch (e) {
          timeIso = null;
        }
      }

      if (!map.has(key)) {
        map.set(key, {
          coinId: t.coinId || null,
          name: t.name || t.symbol || key,
          symbol: t.symbol || null,
          value,
          percent_change_24h: pct24,
          time: timeIso,
        });
      } else {
        const ex = map.get(key);
        const prev = ex.value;
        ex.value = prev + value;
        ex.percent_change_24h =
          ex.value > 0
            ? (ex.percent_change_24h * prev + pct24 * value) / ex.value
            : 0;

        // Keep the earliest timestamp (change to latest by using > instead of <)
        if (timeIso) {
          if (!ex.time) ex.time = timeIso;
          else if (new Date(timeIso) < new Date(ex.time)) ex.time = timeIso;
        }
        map.set(key, ex);
      }
    }

    const distribution = Array.from(map.values());

    // 5) Totals and formatting
    let totalValue = 0;
    let totalChange24h = 0;
    distribution.forEach((d) => {
      totalValue += d.value;
      totalChange24h += d.value * ((d.percent_change_24h || 0) / 100);
    });

    distribution.forEach((d) => {
      d.value = Number(d.value.toFixed(2));
      d.pct = totalValue
        ? Number(((d.value / totalValue) * 100).toFixed(2))
        : 0;
      d.percent_change_24h = Number(
        Number(d.percent_change_24h || 0).toFixed(4)
      );
      // keep time as ISO string or null
      d.time = d.time || null;
    });

    // 6) Build assetsChart (sorted by value desc)
    const assetsChart = distribution
      .sort((a, b) => b.value - a.value)
      .map((d) => ({
        coinId: d.coinId,
        name: d.name,
        symbol: d.symbol,
        value: d.value,
        time: d.time,
      }));

    const totalChange24hPct = totalValue
      ? (totalChange24h / totalValue) * 100
      : 0;

    result.data = {
      totalValue: Number(totalValue.toFixed(2)),
      totalChange24h: Number(totalChange24h.toFixed(2)),
      totalChange24hPct: Number(totalChange24hPct.toFixed(2)),
      assetsChart,
    };
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
