require("dotenv").config();

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
    const { walletAddress, chain } = createDto;
    console.log("[CREATE] Incoming payload:", createDto);

    let tokens = [];

    if (chain === "sol") {
      console.log("[CREATE] Fetching Solana tokens from Helius...");
      tokens = await getWalletTokensHelius(walletAddress);
    } else {
      console.log(
        `[CREATE] Fetching EVM tokens from Moralis for chain: ${chain}...`
      );
      tokens = await getWalletTokensMoralis(walletAddress, chain);
    }

    console.log("[CREATE] Tokens fetched:", tokens.length);

    if (!tokens || tokens.length === 0) {
      console.log("[CREATE] No tokens found for this wallet");
      result.data = [];
      result.message = "No tokens found for this wallet";
      return result;
    }

    // Upsert wallet document with tokens array
    const walletDoc = await Balance.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { $set: { walletAddress: walletAddress.toLowerCase(), tokens } },
      { upsert: true, new: true }
    );

    console.log("[CREATE] Wallet saved/updated in DB:", walletDoc);

    result.data = walletDoc;
    result.message = "Wallet tokens fetched & saved successfully";
    console.log("[CREATE] Final result:", result.message);
  } catch (ex) {
    console.error("[CREATE] Error in Balance.create:", ex.message);
    result.ex = ex.message;
  } finally {
    console.log("[CREATE] Returning result:", result);
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
