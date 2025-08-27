import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY_MORALIS;

const CHAIN = "bsc"; // change chain accordingly e.g "eth", "bsc", "polygon", "avalanche", "fantom", etc.

exports.getWalletTokens = async (walletaddress, chain) => {

    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${walletaddress}/tokens?chain=${chain}`;

    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-API-Key": API_KEY,
      },
    });

    const tokens = await res.json();
  
    tokens.result.forEach((t) => {
        console.log({
            tokenAddress: t.token_address,
            name: t.name,
            symbol: t.symbol,
            balance: Number(t.balance) / (10 ** t.decimals),
            priceUSD: t.usd_price || 0,
            totalValueUSD: (Number(t.balance) / (10 ** t.decimals)) * (t.usd_price || 0),
        });
    });

    return ({
        tokenAddress: t.token_address,
        name: t.name,
        symbol: t.symbol,
        balance: Number(t.balance) / (10 ** t.decimals),
        priceUSD: t.usd_price || 0,
        totalValueUSD: (Number(t.balance) / (10 ** t.decimals)) * (t.usd_price || 0),
    });
}
