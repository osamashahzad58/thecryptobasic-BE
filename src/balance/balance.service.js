require("dotenv").config();
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const API_KEY_MORALIS =
  process.env.API_KEY_MORALIS ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImEzOWVhMDU5LWQwNTEtNGNiOS05MTg2LTIxZjBhNDMwNzY1YyIsIm9yZ0lkIjoiNDcwMjM4IiwidXNlcklkIjoiNDgzNzQ2IiwidHlwZUlkIjoiM2RkMzNiNTctZjVlMS00NzE2LWE1NWMtNzAxYzM5NThlODliIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTc1NzE1ODEsImV4cCI6NDkxMzMzMTU4MX0.4pvqmwvn7F4p-mPJt4jQahho771hL0wwQyrDH_ccotk";
// const API_KEY_MORALIS = process.env.API_KEY_MORALIS;
// const API_KEY_HELIUS = process.env.HELIUS_API_KEY;
const API_KEY_HELIUS =
  process.env.HELIUS_API_KEY || "d3402416-bfa9-481f-a64a-76765ae3a5a2";

let Balance = require("./balance.model");

// MAIN function
exports.create = async (createDto, result = {}) => {
  try {
    const { walletAddress, chain, userId } = createDto;

    if (!walletAddress) {
      result.ex = "walletAddress is required";
      return result;
    }

    let tokens = [];

    // 1. Fetch tokens depending on chain type
    if (chain === "sol") {
      tokens = await getWalletTokensHelius(walletAddress);
    } else {
      tokens = await getWalletTokensMoralis(walletAddress, chain);
    }

    // 2. Handle case with no tokens
    if (!tokens || tokens.length === 0) {
      result.data = [];
      result.message = "No tokens found for this wallet";
      return result;
    }

    // 3. Prepare update object
    const updateData = {
      walletAddress: walletAddress.toLowerCase(),
      tokens,
    };

    // Add userId if provided
    if (userId) {
      updateData.userId = userId;
    }

    // 4. Upsert wallet document (create or update)
    const walletDoc = await Balance.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { $set: updateData },
      { upsert: true, new: true }
    );

    result.data = walletDoc;
    result.message = "Wallet tokens fetched & saved successfully";
  } catch (ex) {
    console.error("[Balance.create] Error:", ex);
    result.ex = ex.message || ex;
  } finally {
    return result;
  }
};

//
// ---------- EVM: Moralis Fetch -------------
//
async function getWalletTokensMoralis(walletAddress, chain = "bsc") {
  const url = `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/tokens?chain=${chain}`;
  console.log("[MORALIS] Fetching tokens from:", url);

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "X-API-Key": API_KEY_MORALIS,
    },
  });

  const tokens = await res.json();
  console.log("[MORALIS] Raw response:", tokens);

  const mapped = tokens.result.map((t) => ({
    tokenAddress: t.token_address,
    name: t.name,
    symbol: t.symbol,
    balance: Number(t.balance) / 10 ** t.decimals,
    priceUSD: t.usd_price || 0,
    totalValueUSD: (Number(t.balance) / 10 ** t.decimals) * (t.usd_price || 0),
  }));

  console.log("[MORALIS] Processed tokens:", mapped.length);
  return mapped;
}

//
// ---------- Solana: Helius + Dexscreener Fetch -------------
//
async function getWalletTokensHelius(walletAddress) {
  const balancesUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${API_KEY_HELIUS}`;
  console.log("[HELIUS] Fetching balances from:", balancesUrl);

  const balancesRes = await fetch(balancesUrl);
  const balancesData = await balancesRes.json();

  const tokens = [];

  for (const token of balancesData.tokens) {
    const mint = token.mint;

    // Token metadata
    const metaUrl = `https://api.helius.xyz/v0/token-metadata?api-key=${API_KEY_HELIUS}`;
    const metaRes = await fetch(metaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mintAccounts: [mint] }),
    });
    const metaData = await metaRes.json();
    const info = metaData[0];

    // Token price
    const dexscreenerUrl = `https://api.dexscreener.com/latest/dex/search?q=${mint}`;
    const metaResPrice = await fetch(dexscreenerUrl);
    const metaDataPrice = await metaResPrice.json();

    const balance = token.amount / 10 ** token.decimals;

    const processedToken = {
      tokenAddress: mint,
      name:
        info?.onChainMetadata?.metadata?.data?.name ||
        info?.offChainMetadata?.metadata?.name,
      symbol:
        info?.onChainMetadata?.metadata?.data?.symbol ||
        info?.offChainMetadata?.metadata?.symbol,
      balance,
      priceUSD:
        info?.tokenInfo?.priceInfo?.pricePerToken ||
        metaDataPrice?.pairs?.[0]?.priceUsd ||
        0,
      totalValueUSD:
        balance *
        (info?.tokenInfo?.priceInfo?.pricePerToken ||
          metaDataPrice?.pairs?.[0]?.priceUsd ||
          0),
    };

    console.log("[HELIUS] Processed token:", processedToken);

    tokens.push(processedToken);
  }

  console.log("[HELIUS] Total tokens processed:", tokens.length);
  return tokens;
}
exports.allAsset = async (byUserIdDto, result = {}) => {
  try {
    const { userId, offset, limit } = byUserIdDto;
    console.log(byUserIdDto, "byUserIdDto");

    // 1. Fetch balance document for user
    const wallet = await Balance.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    console.log(wallet, "wallet");
    // 2. Handle case: no wallet or no tokens
    if (!wallet || !wallet.tokens || wallet.tokens.length === 0) {
      result.data = {
        total: 0,
        limit: Number(limit) || 10,
        offset: Number(offset) || 0,
        totalCurrentValue: 0,
        totalInvestedValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPct: 0,
        items: [],
      };
      return result;
    }

    // 3. Apply pagination
    const start = (Number(offset) - 1) * (Number(limit) || 10);
    const end = start + (Number(limit) || 10);
    const paginatedTokens = wallet.tokens.slice(start, end);

    // 4. Compute stats for each token
    const items = paginatedTokens.map((token) => {
      const price = Number(token.priceUSD || 0);
      const balance = Number(token.balance || 0);
      const value = Number(token.totalValueUSD || balance * price);

      return {
        tokenAddress: token.tokenAddress,
        name: token.name || "",
        symbol: token.symbol || "",
        balance: Number(balance.toFixed(8)),
        priceUSD: Number(price.toFixed(6)),
        totalValueUSD: Number(value.toFixed(2)),
      };
    });

    // 5. Portfolio totals
    const totalCurrentValue = items.reduce(
      (sum, t) => sum + t.totalValueUSD,
      0
    );

    // Note: since you’re pulling from live balances, there’s no "invested value"
    // so we set it same as current or 0, depending on design
    const totalInvestedValue = 0;
    const totalProfitLoss = 0;
    const totalProfitLossPct = 0;

    result.data = {
      total: wallet.tokens.length,
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
      totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
      totalInvestedValue,
      totalProfitLoss,
      totalProfitLossPct,
      items,
    };
  } catch (ex) {
    console.error("[allAsset] Error (balance-based):", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
