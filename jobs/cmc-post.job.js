const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const sharp = require("sharp");
const { createCanvas, registerFont } = require("canvas");
const path = require("path");
const generateCoinImage = require("../1");

registerFont("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", {
  family: "NotoSans",
});
const possibleCJKPaths = [
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansSC-Regular.otf",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansSC-Regular.otf",
];

const cjkFontPath = possibleCJKPaths.find((p) => fs.existsSync(p));

if (cjkFontPath) {
  console.log("✅ Loaded Chinese font from:", cjkFontPath);
  registerFont(cjkFontPath, { family: "NotoSansCJK" });
} else {
  console.warn("⚠️ No CJK font found, using fallback font");
  registerFont("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf", {
    family: "NotoSansCJK",
  });
}

// try {
//   const localFontPath = path.join(
//     __dirname,
//     "../assets/fonts/NotoSans-Regular.ttf"
//   );
//   if (fs.existsSync(localFontPath)) {
//     registerFont(localFontPath, { family: "NotoSans" });
//   } else {
//     console.warn("Local NotoSans not found, using system default font");
//   }
// } catch (err) {
//   console.warn("Font registration failed:", err.message);
// }

// Configuration
const CONFIG = {
  wordpress: {
    url: "https://coinsupdate.org",
    username: "YOUR_WP_USERNAME",
    password: "YOUR_WP_APP_PASSWORD",
    BEARER_TOKEN:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2NvaW5zdXBkYXRlLm9yZyIsImlhdCI6MTc2MDQyNzUyNiwibmJmIjoxNzYwNDI3NTI2LCJleHAiOjE3NjEwMzIzMjYsImRhdGEiOnsidXNlciI6eyJpZCI6IjIifX19.yOBmBfX5lCrHAjZrBSkgY4-MjufdovDLDUiYV6Dxiic",
  },
  dexscreener: {
    newListingsUrl: "https://api.dexscreener.com/token-profiles/latest/v1",
    pairUrl: "https://api.dexscreener.com/latest/dex/tokens/",
  },
  posting: {
    intervalMinutes: 15, // Check for new tokens every 30 minutes
    postsPerRun: 5, // Maximum posts per run
  },
};

class DexScreenerWPBot {
  constructor() {
    // this.wpAuth = Buffer.from(
    //     `${CONFIG.wordpress.username}:${CONFIG.wordpress.password}`
    // ).toString('base64');
    this.wpAuth = CONFIG.wordpress.BEARER_TOKEN;
    this.postedSlugs = new Set();
    this.initializePostedSlugs();
  }

  // Initialize posted slugs from WordPress to prevent duplicates
  async initializePostedSlugs() {
    try {
      const response = await axios.get(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/posts`,
        {
          params: { per_page: 100, _fields: "slug" },
          headers: { Authorization: `Bearer ${this.wpAuth}` },
        }
      );
      response.data.forEach((post) => this.postedSlugs.add(post.slug));
      console.log(`Loaded ${this.postedSlugs.size} existing post slugs`);
    } catch (error) {
      console.log("Error loading existing slugs:", error.message);
    }
  }

  // Generate SEO-friendly slug
  generateSlug(pairData) {
    const symbol = pairData.baseToken.symbol?.toLowerCase() || "token";
    const chain = pairData.chainId?.toLowerCase() || "crypto";
    const contract = pairData.baseToken.address || "";
    return `${contract}`;
  }

  // Fetch newly listed tokens
  async fetchNewListings() {
    try {
      const response = await axios.get(CONFIG.dexscreener.newListingsUrl);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching new listings:", error.message);
      return [];
    }
  }

  // Fetch detailed pair data for a token
  async fetchPairData(tokenAddress) {
    try {
      const response = await axios.get(
        `${CONFIG.dexscreener.pairUrl}${tokenAddress}`
      );
      return response.data.pairs || [];
    } catch (error) {
      console.error(
        `Error fetching pair data for ${tokenAddress}:`,
        error.message
      );
      return [];
    }
  }

  // Add these helper methods to your DexScreenerWPBot class

  // Extract social links from token data
  extractSocialLinks(tokenData, pairData) {
    const links = [];

    // Check multiple possible locations for social links
    const possibleLinks = [
      ...(tokenData.links || []),
      ...(pairData.info?.socials || []),
      ...(pairData.info?.links || []),
    ];

    possibleLinks.forEach((link) => {
      if (typeof link === "string") {
        if (link.includes("twitter.com") || link.includes("x.com")) {
          links.push({ url: link, label: "Twitter", icon: "🐦" });
        } else if (link.includes("t.me")) {
          links.push({ url: link, label: "Telegram", icon: "📢" });
        } else if (
          link.includes("discord.gg") ||
          link.includes("discord.com")
        ) {
          links.push({ url: link, label: "Discord", icon: "💬" });
        } else if (link.includes("github.com")) {
          links.push({ url: link, label: "GitHub", icon: "💻" });
        } else if (link.includes("medium.com")) {
          links.push({ url: link, label: "Medium", icon: "📝" });
        } else if (link.includes("reddit.com")) {
          links.push({ url: link, label: "Reddit", icon: "👥" });
        } else if (link.includes("facebook.com")) {
          links.push({ url: link, label: "Facebook", icon: "👍" });
        } else if (link.includes("instagram.com")) {
          links.push({ url: link, label: "Instagram", icon: "📷" });
        } else if (link.includes("youtube.com") || link.includes("youtu.be")) {
          links.push({ url: link, label: "YouTube", icon: "🎥" });
        } else if (link.includes("http")) {
          links.push({ url: link, label: "Website", icon: "🌐" });
        }
      } else if (typeof link === "object") {
        // Handle object format {url: '', type: ''}
        const url = link.url || link.link;
        const type = link.type || link.label || "";
        if (url) {
          const iconMap = {
            twitter: "🐦",
            telegram: "📢",
            discord: "💬",
            github: "💻",
            medium: "📝",
            reddit: "👥",
            facebook: "👍",
            instagram: "📷",
            youtube: "🎥",
            website: "🌐",
            web: "🌐",
          };
          const icon = iconMap[type.toLowerCase()] || "🔗";
          links.push({
            url,
            label: type.charAt(0).toUpperCase() + type.slice(1),
            icon,
          });
        }
      }
    });

    // Remove duplicates
    return links.filter(
      (link, index, self) => index === self.findIndex((l) => l.url === link.url)
    );
  }

  // Generate TradingView symbol
  generateTradingViewSymbol(symbol, chain) {
    // Default to USD pairing for most tokens
    const baseSymbol = symbol.toUpperCase();

    // Chain-specific exchanges
    const chainExchanges = {
      ethereum: "BINANCE",
      bsc: "BINANCE",
      solana: "BINANCE",
      arbitrum: "BINANCE",
      polygon: "BINANCE",
      avalanche: "BINANCE",
    };

    const exchange = chainExchanges[chain] || "BINANCE";
    return `${exchange}:${baseSymbol}USD`;
  }

  // Get chain status
  getChainStatus(chain) {
    const statuses = {
      ethereum: "✅ Established",
      bsc: "✅ Popular",
      solana: "🚀 High-Speed",
      arbitrum: "⚡ Layer 2",
      polygon: "🌉 Scaling",
      avalanche: "❄️ Fast",
      fantom: "👻 Efficient",
    };
    return statuses[chain] || "🔗 Active";
  }

  // Get chain advantage
  getChainAdvantage(chain) {
    const advantages = {
      ethereum: "its security and extensive DeFi ecosystem",
      bsc: "low transaction fees and high throughput",
      solana: "lightning-fast transactions and scalability",
      arbitrum: "Ethereum compatibility with lower fees",
      polygon: "Ethereum scaling and interoperability",
      avalanche: "sub-second transaction finality",
      fantom: "high performance and low costs",
    };
    return advantages[chain] || "its blockchain capabilities";
  }

  // Get market sentiment
  getMarketSentiment(priceChange, volume) {
    if (priceChange > 15 && volume > 100000) return "🚀 very bullish";
    if (priceChange > 5 && volume > 50000) return "📈 bullish";
    if (priceChange > 0) return "↗️ cautiously optimistic";
    if (priceChange > -5) return "↘️ neutral with pressure";
    if (priceChange > -15) return "📉 bearish";
    return "🔻 strongly bearish";
  }

  // Get investment potential
  getInvestmentPotential(volume, liquidity) {
    if (volume > 100000 && liquidity > 50000)
      return "promising fundamentals with strong market activity";
    if (volume > 50000 && liquidity > 10000)
      return "moderate potential with growing interest";
    if (volume > 10000)
      return "early-stage characteristics with developing traction";
    return "speculative potential requiring careful evaluation";
  }

  // Get native token
  getNativeToken(chain) {
    const tokens = {
      ethereum: "ETH",
      bsc: "BNB",
      polygon: "MATIC",
      arbitrum: "ETH",
      optimism: "ETH",
      avalanche: "AVAX",
      fantom: "FTM",
      solana: "SOL",
    };
    return tokens[chain] || "native tokens";
  }

  // Get DEX name
  getDexName(chain) {
    const dexes = {
      ethereum: "Uniswap",
      bsc: "PancakeSwap",
      polygon: "QuickSwap",
      arbitrum: "Uniswap",
      solana: "Raydium",
      avalanche: "Trader Joe",
    };
    return dexes[chain] || "a DEX";
  }

  // Get DEX link
  getDexLink(chain) {
    const links = {
      ethereum: "https://app.uniswap.org",
      bsc: "https://pancakeswap.finance",
      polygon: "https://quickswap.exchange",
      arbitrum: "https://app.uniswap.org",
      solana: "https://raydium.io",
    };
    return links[chain] || "#";
  }

  // Get explorer link
  getExplorerLink(chain, contract) {
    const explorers = {
      ethereum: `https://etherscan.io/token/${contract}`,
      bsc: `https://bscscan.com/token/${contract}`,
      polygon: `https://polygonscan.com/token/${contract}`,
      arbitrum: `https://arbiscan.io/token/${contract}`,
      solana: `https://solscan.io/token/${contract}`,
      avalanche: `https://snowtrace.io/token/${contract}`,
    };
    return explorers[chain] || "#";
  }
  // Enhanced SEO-optimized content with TradingView, FAQ, and social links
  generateSEOContent(tokenData, pairData) {
    const capitalize = (str) => {
      if (!str) return str;
      // Check if the first character is a Latin letter
      const isLatin = /^[A-Za-z]/.test(str);
      if (isLatin) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }
      // For Japanese/Chinese,
      return str;
    };

    const symbol = capitalize(pairData.baseToken.symbol || "Unknown");
    const name = capitalize(pairData.baseToken.name || symbol);
    const chain = pairData.chainId || "blockchain";
    const price = pairData.priceUsd || "N/A";
    const volume24h = pairData.volume?.h24 || 0;
    const liquidity = pairData.liquidity?.usd || 0;
    const priceChange24h = pairData.priceChange?.h24 || 0;
    const marketCap = pairData.marketCap || "N/A";
    const dexUrl = pairData.url || "";
    const contractAddress = tokenData.tokenAddress || "";

    // SEO-optimized title
    const title = `${name} (${symbol}) Price Today, Live Chart & Market Analysis | ${chain.toUpperCase()} Token`;

    // Enhanced excerpt for better click-through rates
    const excerpt = `🚀 Live ${symbol} price: $${price} | ${
      priceChange24h > 0 ? "📈" : "📉"
    } ${priceChange24h > 0 ? "+" : ""}${priceChange24h}% | 💰 Market Cap: ${
      marketCap !== "N/A" ? "$" + this.formatNumber(marketCap) : "N/A"
    } | Get real-time ${symbol} charts, trading signals, and comprehensive market analysis.`;

    // Extract social links and website
    const socialLinks = this.extractSocialLinks(tokenData, pairData);
    const hasSocialLinks = socialLinks.length > 0;

    // Generate TradingView symbol (adjust based on chain)
    const tradingViewSymbol = this.generateTradingViewSymbol(symbol, chain);
    const tvSymbol = `${symbol.toUpperCase()}USD`;
    console.log("tradingViewSymbol", tradingViewSymbol);

    const content = `
<!-- wp:paragraph {"className":"lead-intro"} -->
<p class="lead-intro">
  <strong>${name} (${symbol})</strong> is a newly listed <strong>crypto currency</strong> token on the ${chain.toUpperCase()} blockchain Contract:<span class="contract-address">${contractAddress}</span>, gaining growing attention across the DeFi and crypto news space. 
</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"lead-intro"} -->
<p class="lead-intro">
This comprehensive analysis covers live <strong>crypto coins news</strong>, updated <strong>crypto ranks</strong>, and the latest <strong>crypto bubbles</strong> trends. You’ll also find detailed insights on <strong>crypto coins market cap</strong>, price movement, and how this project compares within the wider <strong>coin news crypto</strong> ecosystem. Whether you're tracking market sentiment or watching for the next <strong>crypto bubble</strong>, this page provides the data and context needed for informed trading decisions.
</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>📈 Live ${symbol} Price Chart & Technical Analysis</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Track ${symbol} price movements in real-time with our advanced TradingView chart. Monitor key support/resistance levels, trading volume, and technical indicators for better trading decisions.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div style="width:100%;height:520px;border-radius:12px;overflow:hidden;">
  <iframe 
        src="${pairData.url}?embed=1"
        width="100%"
        height="800"
        scrolling="no" allowtransparency="true"
        class="dexscreener-embed"
        frameborder="0"
        allow="clipboard-read; clipboard-write"
    ></iframe>
</div>
<!-- /wp:html -->

<br/>
<br/>

${
  pairData.info && pairData.info.imageUrl
    ? `
<!-- wp:image {"align":"center","sizeSlug":"large"} -->
<figure class="wp-block-image aligncenter size-large">
<img src="${
        pairData.info.imageUrl
      }" alt="${name} (${symbol}) Token Logo - ${chain.toUpperCase()} Blockchain" style="max-width:100%;height:auto;"/>
<figcaption class="wp-element-caption">${name} (${symbol}) Token</figcaption>
</figure>
<!-- /wp:image -->`
    : ""
}

<!-- wp:heading -->
<h2>${symbol} Price & Market Dashboard</h2>
<!-- /wp:heading -->

<!-- wp:table {"className":"market-data-table"} -->
<figure class="wp-block-table market-data-table">
<table>
<thead>
<tr>
<th>Market Metric</th>
<th>Current Value</th>
<th>Status</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>💰 Current Price</strong></td>
<td>$${price}</td>
<td><span style="color: ${
      priceChange24h > 0 ? "#10b981" : "#ef4444"
    }; font-weight: bold;">${priceChange24h > 0 ? "↗️" : "↘️"} ${
      priceChange24h > 0 ? "+" : ""
    }${priceChange24h}%</span></td>
</tr>
<tr>
<td><strong>📈 24h Trading Volume</strong></td>
<td>$${this.formatNumber(volume24h)}</td>
<td>${
      volume24h > 100000
        ? "🔥 High"
        : volume24h > 50000
        ? "📊 Moderate"
        : "📝 Developing"
    }</td>
</tr>
<tr>
<td><strong>💧 Liquidity</strong></td>
<td>$${this.formatNumber(liquidity)}</td>
<td>${
      liquidity > 50000
        ? "✅ Strong"
        : liquidity > 10000
        ? "⚠️ Adequate"
        : "🔴 Limited"
    }</td>
</tr>
<tr>
<td><strong>🏦 Market Cap</strong></td>
<td>${
      marketCap !== "N/A"
        ? "$" + this.formatNumber(marketCap)
        : "Calculating..."
    }</td>
<td>${
      marketCap !== "N/A" && marketCap > 1000000
        ? "📊 Established"
        : "🆕 Emerging"
    }</td>
</tr>
<tr>
<td><strong>⛓️ Blockchain</strong></td>
<td>${chain.toUpperCase()}</td>
<td>${this.getChainStatus(chain)}</td>
</tr>
<tr>
<td><strong>🔗 Contract Address</strong></td>
<td><code>${contractAddress}</code></td>
<td><button style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 12px;" onclick="navigator.clipboard.writeText('${contractAddress}')">📋 Copy</button></td>
</tr>
</tbody>
</table>
</figure>
<!-- /wp:table -->

<br/>
<br/>

<!-- wp:buttons -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"vivid-cyan-blue","textColor":"white"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-vivid-cyan-blue-background-color has-text-color has-background wp-element-button" href="${dexUrl}" target="_blank" rel="noopener noreferrer">📊 View Advanced Chart on DexScreener</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<br/>
<br/>
<!-- wp:heading -->
<h2>🔍 ${symbol} Token Deep Dive Analysis</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Market Position & Sentiment:</strong> ${symbol} is showing <strong>${this.getMarketSentiment(
      priceChange24h,
      volume24h
    )}</strong> momentum with ${
      volume24h > 50000
        ? "strong community engagement"
        : "growing trader interest"
    }. The token operates on ${chain.toUpperCase()}, known for ${this.getChainAdvantage(
      chain
    )}.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>
<li><strong>Price Trend:</strong> ${
      priceChange24h > 0 ? "Bullish" : "Bearish"
    } with ${Math.abs(priceChange24h).toFixed(2)}% movement</li>
<li><strong>Volume Health:</strong> ${
      volume24h > 100000
        ? "Exceptional"
        : volume24h > 50000
        ? "Healthy"
        : "Developing"
    } trading activity</li>
<li><strong>Liquidity Quality:</strong> ${
      liquidity > 50000
        ? "Excellent for trading"
        : liquidity > 10000
        ? "Adequate for most trades"
        : "Caution advised for large orders"
    }</li>
<li><strong>Market Stage:</strong> ${
      marketCap !== "N/A" && marketCap > 1000000
        ? "Established presence"
        : "Early discovery phase"
    }</li>
</ul>
<!-- /wp:list -->

${
  hasSocialLinks
    ? `
<!-- wp:heading -->
<h2>🌐 Official ${symbol} Links & Social Media</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Stay updated with the latest ${symbol} news and community discussions through these official channels:</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons">${socialLinks
        .map(
          (link) => `
<!-- wp:button {"style":{"border":{"radius":"4px"}},"className":"social-button"} -->
<div class="wp-block-button social-button"><a class="wp-block-button__link wp-element-button" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.icon} ${link.label}</a></div>
<!-- /wp:button -->`
        )
        .join("")}
</div>
<!-- /wp:buttons -->`
    : ""
}
<br/>
<br/>
<!-- wp:heading -->
<h2>🛒 How to Buy ${symbol} - Step by Step Guide</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"buying-steps"} -->
<div class="wp-block-group buying-steps">
<!-- wp:heading {"level":3} -->
<h3>Step 1: Setup Your Wallet</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Install a ${chain.toUpperCase()}-compatible wallet like <strong>MetaMask</strong>, <strong>Trust Wallet</strong>, or <strong>Coinbase Wallet</strong>. Secure your recovery phrase and never share it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Step 2: Fund with Native Tokens</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Purchase ${this.getNativeToken(
      chain
    )} from exchanges like Binance, Coinbase, or Kraken for network fees (gas).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Step 3: Connect to DEX</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Visit ${this.getDexName(
      chain
    )} or similar DEX, connect your wallet, and ensure you're on the ${chain.toUpperCase()} network.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Step 4: Execute Trade</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Paste the contract address: <code>${contractAddress}</code> • Verify token details • Set 2-3% slippage • Confirm swap</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
<br/>
<br/>
<!-- wp:heading -->
<h2>❓ Frequently Asked Questions About ${symbol}</h2>
<!-- /wp:heading -->

<!-- wp:group {"className":"faq-section"} -->
<div class="wp-block-group faq-section">
<!-- wp:heading {"level":3} -->
<h3>What is ${symbol} token and what does it do?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name} (${symbol}) is a cryptocurrency token deployed on ${chain.toUpperCase()} blockchain. ${
      tokenData.description ||
      `It serves as a digital asset within the ${chain.toUpperCase()} ecosystem, enabling various DeFi applications and community-driven initiatives.`
    }</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h4>Is ${symbol} a good investment in ${new Date().getFullYear()}?</h4>

<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>All cryptocurrency investments carry risk. ${symbol} shows ${this.getInvestmentPotential(
      volume24h,
      liquidity
    )} based on current metrics. Always conduct your own research (DYOR), assess risk tolerance, and never invest more than you can afford to lose.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h4>How can I verify the ${symbol} contract address?</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Always verify the contract address from official sources: <code>${contractAddress}</code>. Cross-check with the project's official website and social media channels to avoid scam tokens.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h4>What's the difference between market cap and liquidity?</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Market Cap</strong> represents total value: Price × Total Supply. <strong>Liquidity</strong> is the available funds in trading pools. High liquidity ensures better trade execution with less slippage.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h4>Can I stake ${symbol} for rewards?</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Staking availability depends on the token's utility. Check the official ${symbol} website or community channels for staking programs, yield farming opportunities, or liquidity provider rewards.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
<br/>
<br/>
<!-- wp:heading -->
<h2>⚠️ Essential Trading & Safety Tips</h2>
<!-- /wp:heading -->

<!-- wp:warning {"className":"safety-warning"} -->
<div class="wp-block-warning safety-warning">
<!-- wp:list -->
<ul>
<li>🔒 <strong>Always verify contract addresses</strong> before trading</li>
<li>📚 <strong>Do Your Own Research (DYOR)</strong> - don't rely solely on social media</li>
<li>💰 <strong>Start with small amounts</strong> to test the waters</li>
<li>📊 <strong>Monitor liquidity levels</strong> - low liquidity means higher slippage</li>
<li>🚨 <strong>Beware of pump-and-dump schemes</strong> in new tokens</li>
<li>💼 <strong>Use hardware wallets</strong> for long-term storage</li>
<li>⚡ <strong>Keep software updated</strong> for security patches</li>
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:warning -->
<br/>
<br/>
<!-- wp:heading -->
<h2>🔗 Important ${symbol} Resources</h2>
<!-- /wp:heading -->

<!-- wp:buttons -->
<div class="wp-block-buttons">
<!-- wp:button {"style":{"border":{"radius":"4px"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${dexUrl}" target="_blank" rel="noopener noreferrer">📈 Live Chart on DexScreener</a></div>
<!-- /wp:button -->

<!-- wp:button {"style":{"border":{"radius":"4px"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${this.getExplorerLink(
      chain,
      contractAddress
    )}" target="_blank" rel="noopener noreferrer">🔍 View on Blockchain Explorer</a></div>
<!-- /wp:button -->

<!-- wp:button {"style":{"border":{"radius":"4px"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${this.getDexLink(
      chain
    )}" target="_blank" rel="noopener noreferrer">💱 Trade on ${this.getDexName(
      chain
    )}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<br/>
<br/>
<!-- wp:paragraph -->
<p><em>🕒 Last Updated: ${new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</em></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"className":"disclaimer"} -->
<p class="disclaimer"><small><strong>📝 Disclaimer:</strong> This content is for educational and informational purposes only. It does not constitute financial advice, investment recommendation, or endorsement. Cryptocurrency markets are highly volatile and risky. Always conduct your own research and consult with qualified financial advisors before making investment decisions. Past performance is not indicative of future results.</small></p>
<!-- /wp:paragraph -->
`;

    return { title, content, excerpt };
  }

  // Format large numbers
  formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(2) + "K";
    return num.toFixed(2);
  }

  // Get or create category
  async getOrCreateCategory(categoryName) {
    try {
      // Search for existing category
      const searchResponse = await axios.get(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/categories`,
        {
          params: { search: categoryName, per_page: 1 },
          headers: { Authorization: `Bearer ${this.wpAuth}` },
        }
      );

      if (searchResponse.data.length > 0) {
        return searchResponse.data[0].id;
      }

      // Create new category
      const createResponse = await axios.post(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/categories`,
        {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
        },
        { headers: { Authorization: `Bearer ${this.wpAuth}` } }
      );

      return createResponse.data.id;
    } catch (error) {
      console.error("Error with category:", error.message);
      return null;
    }
  }

  // Get or create tags
  async getOrCreateTags(tagNames) {
    const tagIds = [];

    for (const tagName of tagNames) {
      try {
        const searchResponse = await axios.get(
          `${CONFIG.wordpress.url}/wp-json/wp/v2/tags`,
          {
            params: { search: tagName, per_page: 1 },
            headers: { Authorization: `Bearer ${this.wpAuth}` },
          }
        );

        if (searchResponse.data.length > 0) {
          tagIds.push(searchResponse.data[0].id);
        } else {
          const createResponse = await axios.post(
            `${CONFIG.wordpress.url}/wp-json/wp/v2/tags`,
            { name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, "-") },
            { headers: { Authorization: `Bearer ${this.wpAuth}` } }
          );
          tagIds.push(createResponse.data.id);
        }
      } catch (error) {
        console.error(`Error with tag ${tagName}:`, error.message);
      }
    }

    return tagIds;
  }
  async uploadPlaceHolderImage(imageUrl, alt) {
    try {
      // Download image
      const imgResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(imgResponse.data, "binary");

      // Upload to WordPress
      const uploadRes = await axios.post(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/media`,
        buffer,
        {
          headers: {
            "Content-Type": imgResponse.headers["content-type"],
            "Content-Disposition": `attachment; filename="featured-${Date.now()}.jpg"`,
            //'Authorization': 'Basic ' + Buffer.from(`${this.wpUsername}:${this.wpPassword}`).toString('base64')
            Authorization: "Bearer " + this.wpAuth,
          },
        }
      );

      // Update alt text
      await axios.post(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/media/${uploadRes.data.id}`,
        { alt_text: alt },
        {
          headers: {
            //'Authorization': 'Basic ' + Buffer.from(`${this.wpUsername}:${this.wpPassword}`).toString('base64'),
            Authorization: "Bearer " + this.wpAuth,
            "Content-Type": "application/json",
          },
        }
      );

      return uploadRes.data.id;
    } catch (err) {
      console.error("Image upload error:", err.message);
      return null;
    }
  }
  // Download and upload featured image
  // Upload or fallback to Unicode-safe placeholder

  async generateImageWithUnicodeText(text) {
    const width = 1200;
    const height = 630;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, width, height);

    // Detect if text contains Chinese (or other CJK characters)
    const isCJK = /[\u4e00-\u9fff]/.test(text);

    // Choose font family
    const fontFamily = isCJK ? "NotoSansCJK" : "NotoSans";

    // Text styling
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Try different font sizes to fit text width
    let fontSize = 64;
    ctx.font = `bold ${fontSize}px "${fontFamily}"`;

    let metrics = ctx.measureText(text);
    if (metrics.width > width - 100) {
      fontSize = Math.floor(64 * ((width - 100) / metrics.width));
      ctx.font = `bold ${fontSize}px "${fontFamily}"`;
    }

    // Draw text
    ctx.fillText(text, width / 2, height / 2);

    return canvas.toBuffer("image/png");
  }

  async uploadFeaturedImage(tokenSymbol, name) {
    const text = (tokenSymbol || "Crypto").trim();

    console.log(`🖼️ Generating image for: ${text}`);

    try {
      // Your existing WordPress search logic...
      const existing = await axios.get(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/media`,
        {
          params: { search: encodeURIComponent(text), per_page: 50 },
          headers: { Authorization: `Bearer ${this.wpAuth}` },
        }
      );

      const match = existing.data.find((m) =>
        m.title.rendered.toLowerCase().includes(text.toLowerCase())
      );

      if (match) {
        console.log(`🔁 Using existing image for ${text}: ${match.source_url}`);
        return { id: match.id, url: match.source_url, alt: text };
      }

      // Generate image locall
      console.log(`🎨 Creating local image for Unicode text`);
      //const imageBuffer = await this.generateImageWithUnicodeText(text);
      // const info = {
      //   coinSymbol: text,
      //   coinName: name,
      // };
      // const imageBuffer = await generateCoinImage(info);
      // Helper: Capitalize only English (Latin) text
      const capitalize = (str) => {
        if (!str) return str;
        const isLatin = /^[A-Za-z]/.test(str);
        if (isLatin) {
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }
        return str;
      };

      // Apply it here
      const info = {
        coinSymbol: capitalize(text),
        coinName: capitalize(name),
      };

      const imageBuffer = await generateCoinImage(info);

      // Upload to WordPress
      const hash = require("crypto")
        .createHash("md5")
        .update(text)
        .digest("hex")
        .substr(0, 8);
      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: `featured-${hash}-${Date.now()}.png`,
        contentType: "image/png",
      });

      const uploadResponse = await axios.post(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/media`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.wpAuth}`,
          },
        }
      );

      // Update metadata
      await axios.put(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/media/${uploadResponse.data.id}`,
        { alt_text: text, title: text },
        {
          headers: {
            Authorization: `Bearer ${this.wpAuth}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`✅ Uploaded new featured image for ${text}`);
      return {
        id: uploadResponse.data.id,
        url: uploadResponse.data.source_url,
        alt: text,
      };
    } catch (error) {
      console.error("❌ Error handling featured image:", error.message);
      // Fallback - create simple colored image without text
      const fallbackUrl = `https://dummyimage.com/1200x630/0d1117/ffffff.png`;
      return { id: null, url: fallbackUrl, alt: text };
    }
  }

  // Create WordPress post
  async createWordPressPost(tokenData, pairData) {
    console.log("tokenData", tokenData);
    console.log("pairData", pairData);

    const slug = this.generateSlug(pairData);

    // Skip duplicate posts
    if (this.postedSlugs.has(slug)) {
      console.log(`⏭️ Skipping duplicate: ${slug}`);
      return null;
    }

    const { title, content, excerpt } = this.generateSEOContent(
      tokenData,
      pairData
    );

    // Always use placeholder image
    const featuredImage = await this.uploadFeaturedImage(
      pairData.baseToken.symbol,
      pairData.baseToken.name
    );

    console.log("featuredImage", featuredImage);

    // Get categories
    const chainCategory = await this.getOrCreateCategory(
      `${pairData.chainId?.toUpperCase() || "Crypto"} Tokens`
    );
    const newListingCategory = await this.getOrCreateCategory("New Listings");

    // Get tags
    const tags = await this.getOrCreateTags([
      pairData.baseToken.symbol,
      pairData.baseToken.name,
      pairData.chainId,
      "DeFi",
      "Cryptocurrency",
      "Trading",
      "New Token",
    ]);

    // ✅ Build postData safely
    const postData = {
      title,
      content: `${content}`, // prepend only if exists
      excerpt,
      slug,
      status: "publish",
      categories: [chainCategory, newListingCategory].filter(Boolean),
      tags,
      featured_media: featuredImage?.id || null,
      meta: {
        _yoast_wpseo_title: `${title} | Latest Price & Analysis`,
        _yoast_wpseo_metadesc: excerpt.substring(0, 155),
        _yoast_wpseo_focuskw: `${tokenData.symbol} token`,
      },
    };

    try {
      const response = await axios.post(
        `${CONFIG.wordpress.url}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${this.wpAuth}`,
            "Content-Type": "application/json",
          },
        }
      );

      this.postedSlugs.add(slug);
      console.log(`✅ Posted: ${title}`);
      console.log(`   URL: ${response.data.link}`);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error creating post:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Main bot process
  async run() {
    console.log("🤖 DexScreener WordPress Bot Started");
    console.log(`📅 ${new Date().toLocaleString()}`);
    console.log("─".repeat(50));

    try {
      // Fetch new listings
      const newListings = await this.fetchNewListings();
      console.log(`📊 Found ${newListings.length} new token listings`);

      let postsCreated = 0;

      for (const listing of newListings.slice(0, CONFIG.posting.postsPerRun)) {
        if (!listing.tokenAddress) continue;

        // Fetch detailed pair data
        const pairs = await this.fetchPairData(listing.tokenAddress);

        if (pairs.length === 0) {
          console.log(`⚠️  No pair data for ${listing.tokenAddress}`);
          continue;
        }

        // Use the pair with highest liquidity
        const bestPair = pairs.reduce((prev, current) =>
          (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0)
            ? current
            : prev
        );

        // Create WordPress post
        const post = await this.createWordPressPost(listing, bestPair);

        if (post) {
          postsCreated++;
          // Rate limiting
          await this.sleep(5000); // Wait 5 seconds between posts
        }
      }

      console.log("─".repeat(50));
      console.log(`✨ Completed: ${postsCreated} posts created`);
      console.log(`⏰ Next run in ${CONFIG.posting.intervalMinutes} minutes`);
    } catch (error) {
      console.error("❌ Bot error:", error.message);
    }
  }

  // Utility sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Start bot with interval
  start() {
    console.log("🚀 Starting DexScreener WordPress Bot...");

    // Run immediately
    this.run();

    // Schedule recurring runs
    setInterval(() => {
      this.run();
    }, CONFIG.posting.intervalMinutes * 60 * 1000);
  }
}

// Initialize and start bot
const bot = new DexScreenerWPBot();
bot.start();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Bot stopped gracefully");
  process.exit(0);
});
