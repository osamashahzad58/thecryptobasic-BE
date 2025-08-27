import dotenv from "dotenv";
dotenv.config();

API_KEY_HELIUS = process.env.HELIUS_API_KEY;
async function getWalletTokensHelius(WALLET) {
    
    const balancesUrl = `https://api.helius.xyz/v0/addresses/${WALLET}/balances?api-key=${API_KEY_HELIUS}`;
    const balancesRes = await fetch(balancesUrl);
    const balancesData = await balancesRes.json();


    for (const token of balancesData.tokens) {
      const mint = token.mint;

      console.log("mint: ", {mint}, );

      const metaUrl = `https://api.helius.xyz/v0/token-metadata?api-key=${API_KEY_HELIUS}`;
      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAccounts: [mint] }),
      });
  
      const metaData = await metaRes.json();
      const info = metaData[0];
    
      const dexscreenerUrl = `https://api.dexscreener.com/latest/dex/search?q=${mint}`
      const metaResPrice = await fetch(dexscreenerUrl, {
          method: "GET"
        });
        const metaDataPrice = await metaResPrice.json();
        const infoPrice = metaDataPrice[0];
        
        console.log({
            mint,
            amount: token.amount / (10 ** token.decimals), name: info?.onChainMetadata?.metadata?.data?.name || info?.offChainMetadata?.metadata?.name,
            symbol: info?.onChainMetadata?.metadata?.data?.symbol || info?.offChainMetadata?.metadata?.symbol,
            price: info?.tokenInfo?.priceInfo?.pricePerToken || metaDataPrice?.pairs[0]?.priceUsd || metaDataPrice?.pairs[0]?.priceNative
        });
    }

    return ({
        mint,
        amount: token.amount / (10 ** token.decimals), name: info?.onChainMetadata?.metadata?.data?.name || info?.offChainMetadata?.metadata?.name,
        symbol: info?.onChainMetadata?.metadata?.data?.symbol || info?.offChainMetadata?.metadata?.symbol,
        price: info?.tokenInfo?.priceInfo?.pricePerToken || metaDataPrice?.pairs[0]?.priceUsd || metaDataPrice?.pairs[0]?.priceNative
    });
  }
  