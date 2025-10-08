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

let Portfolio = require("../portfolio/portfolio.model");
let Balance = require("./balance.model");
let Transaction = require("../transaction/transaction.model");
let Coin = require("../cmc-coins/models/cmc-coins.model");

// MAIN function
exports.create = async (createDto, result = {}) => {
  try {
    const { walletAddress, chain, userId, name, isMe } = createDto;

    // 1. Validate input
    if (!walletAddress) {
      result.ex = new Error("walletAddress is required");
      return result;
    }

    let tokens = [];

    // 2. Fetch tokens from appropriate source
    if (chain === "sol") {
      tokens = await getWalletTokensHelius(walletAddress);
    } else {
      tokens = await getWalletTokensMoralis(walletAddress, chain);
    }

    // 3. If no tokens found
    if (!tokens || tokens.length === 0) {
      result.data = [];
      result.message = "No tokens found for this wallet";
      return result;
    }

    // 4. Prepare update data
    const updateData = {
      walletAddress: walletAddress.toLowerCase(),
      tokens,
      ...(name && { name }),
      ...(typeof isMe === "boolean" && { isMe }),
      ...(userId && { userId }),
    };

    // 5. Upsert wallet document (update if exists, otherwise create new)
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

    /** ==============================
     *  1. FETCH BALANCES (WALLETS)
     * =============================== */
    const balances = await Balance.find({ userId: userObjectId });

    const walletData = balances.map((wallet) => {
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

    // Split based on isMe flag
    const myWallets = walletData.filter((w) => w.isMe);
    const otherWallets = walletData.filter((w) => !w.isMe);

    const myWalletTotal = myWallets.reduce(
      (sum, w) => sum + w.totalValueUSD,
      0
    );
    const otherWalletTotal = otherWallets.reduce(
      (sum, w) => sum + w.totalValueUSD,
      0
    );

    /** ==============================
     *  2. FETCH PORTFOLIOS + TRANSACTIONS
     * =============================== */
    const portfolios = await Portfolio.find({ userId: userObjectId });

    let portfolioData = [];

    if (portfolios.length) {
      const portfolioIds = portfolios.map((p) => p._id);
      const transactions = await Transaction.find({
        portfolioId: { $in: portfolioIds },
      });

      const coinIds = [...new Set(transactions.map((tx) => tx.coinId))];
      const coins = await Coin.find({ coinId: { $in: coinIds } });

      const coinMap = {};
      for (const coin of coins) {
        coinMap[coin.coinId] = coin;
      }

      const transactionsByPortfolio = {};
      const portfolioHoldings = {};

      for (const tx of transactions) {
        const pid = tx.portfolioId.toString();
        if (!transactionsByPortfolio[pid]) transactionsByPortfolio[pid] = [];
        if (!portfolioHoldings[pid]) portfolioHoldings[pid] = {};

        const coinInfo = coinMap[tx.coinId] || {};
        const coinId = tx.coinId;

        transactionsByPortfolio[pid].push({
          ...tx.toObject(),
          coinInfo: {
            coinId: coinInfo.coinId || tx.coinId,
            logo: coinInfo.logo || null,
            price: coinInfo.price || 0,
            market_cap: coinInfo.market_cap || 0,
            percent_change_7d: coinInfo.percent_change_7d || 0,
            percent_change_24h: coinInfo.percent_change_24h || 0,
            percent_change_1h: coinInfo.percent_change_1h || 0,
            volume_change_24h: coinInfo.volume_change_24h || 0,
          },
        });

        const currentQty = portfolioHoldings[pid][coinId] || 0;

        if (tx.type === "buy") {
          portfolioHoldings[pid][coinId] = currentQty + tx.quantity;
        } else if (tx.type === "sell") {
          portfolioHoldings[pid][coinId] = currentQty - tx.quantity;
        } else if (tx.type === "transfer") {
          if (tx.transferDirection === "in") {
            portfolioHoldings[pid][coinId] = currentQty + tx.quantity;
          } else if (tx.transferDirection === "out") {
            portfolioHoldings[pid][coinId] = currentQty - tx.quantity;
          }
        }
      }

      portfolioData = portfolios.map((portfolio) => {
        const pid = portfolio._id.toString();
        const holdings = portfolioHoldings[pid] || {};
        let totalValue = 0;

        for (const [coinId, qty] of Object.entries(holdings)) {
          const coin = coinMap[coinId];
          if (coin && coin.price && qty > 0) {
            totalValue += qty * coin.price;
          }
        }

        return {
          ...portfolio.toObject(),
          totalValue: Number(totalValue.toFixed(2)),
          transactions: transactionsByPortfolio[pid] || [],
        };
      });
    }

    const totalPortfolioValue = portfolioData.reduce(
      (sum, p) => sum + (p.totalValue || 0),
      0
    );

    /** ==============================
     *  3. FINAL RESULT
     * =============================== */
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
    console.error("[getList] Error:", ex);
    result.ex = ex;
  } finally {
    return result;
  }
};
