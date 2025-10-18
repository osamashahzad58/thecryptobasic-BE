// /**
//  * generate-coin-image-centered.js
//  *
//  * Centers the badge + title + subtitle as a single composition in the middle
//  * of the image (both horizontally and vertically).
//  *
//  * Drop TTFs in ./fonts/ (NotoSans-Bold.ttf, NotoSans-Regular.ttf) if available.
//  * npm install @napi-rs/canvas
//  * node generate-coin-image-centered.js
//  */

// const fs = require("fs");
// const path = require("path");

// let createCanvas, registerFont;
// try {
//   ({ createCanvas, registerFont } = require("@napi-rs/canvas"));
// } catch (e1) {
//   try {
//     ({ createCanvas, registerFont } = require("canvas"));
//   } catch (e2) {
//     throw new Error(
//       "Install @napi-rs/canvas or canvas: npm install @napi-rs/canvas"
//     );
//   }
// }

// // Optional: register fonts for consistent measureText
// const fontsDir = path.join(__dirname, "fonts");
// try {
//   registerFont(path.join(fontsDir, "NotoSans-Bold.ttf"), {
//     family: "NotoSans",
//     weight: "700",
//   });
//   registerFont(path.join(fontsDir, "NotoSans-Regular.ttf"), {
//     family: "NotoSans",
//     weight: "400",
//   });
// } catch (err) {
//   // ignoring — fallback fonts will be used
// }

// function roundRect(ctx, x, y, w, h, r) {
//   const radius = Math.max(0, r);
//   ctx.beginPath();
//   ctx.moveTo(x + radius, y);
//   ctx.arcTo(x + w, y, x + w, y + h, radius);
//   ctx.arcTo(x + w, y + h, x, y + h, radius);
//   ctx.arcTo(x, y + h, x, y, radius);
//   ctx.arcTo(x, y, x + w, y, radius);
//   ctx.closePath();
// }

// function wrapTextNoMidWord(ctx, text, maxWidth) {
//   const words = text.split(" ");
//   const lines = [];
//   let line = "";
//   for (const word of words) {
//     const testLine = line ? `${line} ${word}` : word;
//     if (ctx.measureText(testLine).width <= maxWidth) {
//       line = testLine;
//     } else {
//       if (line) lines.push(line);
//       line = word;
//     }
//   }
//   if (line) lines.push(line);
//   return lines;
// }

// async function generateCoinImage(opts = {}) {
//   const config = Object.assign(
//     {
//       width: 1200,
//       height: 630,
//       scale: 2,
//       coinSymbol: "$Coin",
//       coinName: "Coin Name",
//       primaryFont: "NotoSans", // registered family name (fallbacks used if missing)
//       format: "png",
//       watermark: "https://coinsupdate.org",
//       badgePalette: ["#17c3b2", "#0a6fb2", "#003f7f"],
//       subtitle: "new listing",
//       maxTitleLines: 3,
//     },
//     opts
//   );

//   const { width, height, scale, primaryFont: pf } = config;
//   const W = Math.round(width * scale);
//   const H = Math.round(height * scale);
//   const S = scale;

//   const canvas = createCanvas(W, H);
//   const ctx = canvas.getContext("2d");

//   // Background gradient
//   const grad = ctx.createLinearGradient(0, 0, W, H);
//   grad.addColorStop(0, "#0f1724");
//   grad.addColorStop(0.5, "#0b1220");
//   grad.addColorStop(1, "#051426");
//   ctx.fillStyle = grad;
//   ctx.fillRect(0, 0, W, H);

//   // Subtle stripes
//   ctx.save();
//   ctx.globalAlpha = 0.035;
//   ctx.fillStyle = "#ffffff";
//   const stripeW = 60 * S;
//   for (let x = -W; x < W * 2; x += stripeW) {
//     ctx.beginPath();
//     ctx.moveTo(x, 0);
//     ctx.lineTo(x + stripeW / 2, 0);
//     ctx.lineTo(x - W, H);
//     ctx.lineTo(x - W - stripeW / 2, H);
//     ctx.closePath();
//     ctx.fill();
//   }
//   ctx.restore();

//   // Badge params (we will center the badge horizontally as part of the block)
//   const badgeSize = 260 * S;
//   const badgeRadius = 30 * S;
//   const badgeHalf = badgeSize / 2;

//   // Title autoscale/wrap: try a font size and reduce until the text fits within maxTextWidth and lines <= maxTitleLines
//   const maxTextWidth = Math.min(800 * S, W * 0.72); // allow a fairly wide title but not edge-to-edge
//   let fontSize = 90 * S;
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";

//   // Reduce font until wrapped lines are acceptable
//   let lines;
//   while (fontSize >= 32 * S) {
//     ctx.font = `700 ${fontSize}px "${pf}"`;
//     // smart manual split for some known phrases
//     const nameLower = config.coinName.toLowerCase();
//     if (nameLower.includes("ownership protocol")) {
//       lines = ["Data Ownership", "Protocol"];
//     } else if (nameLower.includes("coinmarketcap")) {
//       lines = ["CoinMarketCap", "Listing"];
//     } else {
//       lines = wrapTextNoMidWord(ctx, config.coinName, maxTextWidth);
//     }
//     const tooWide = lines.some(
//       (ln) => ctx.measureText(ln).width > maxTextWidth
//     );
//     if (!tooWide && lines.length <= config.maxTitleLines) break;
//     fontSize -= 4 * S;
//   }
//   // safety: if font got too small but still long, allow it (lines set already)

//   const lineHeight = fontSize * 1.15;
//   // subtitle sizing
//   const subtitleFontSize = Math.round(28 * S);
//   ctx.font = `400 ${subtitleFontSize}px "${pf}"`;
//   const subtitleHeight = subtitleFontSize * 1.2;

//   // Compute the total block height: badge + gap + title block + gap + subtitle
//   const gapBadgeToTitle = 24 * S;
//   const gapTitleToSubtitle = 18 * S;
//   const titleBlockHeight = lines.length * lineHeight;
//   const totalBlockHeight =
//     badgeSize +
//     gapBadgeToTitle +
//     titleBlockHeight +
//     gapTitleToSubtitle +
//     subtitleHeight;

//   // Compute top of block so block is vertically centered
//   const topY = Math.round(H / 2 - totalBlockHeight / 2);

//   // Badge center (centered horizontally)
//   const badgeCenterX = Math.round(W / 2);
//   const badgeCenterY = Math.round(topY + badgeHalf);

//   // Draw badge (centered)
//   ctx.save();
//   ctx.translate(badgeCenterX, badgeCenterY);
//   // Keep badge non-rotated for a balanced centered look
//   const rectGrad = ctx.createLinearGradient(
//     -badgeHalf,
//     -badgeHalf,
//     badgeHalf,
//     badgeHalf
//   );
//   rectGrad.addColorStop(0, config.badgePalette[0]);
//   rectGrad.addColorStop(0.6, config.badgePalette[1]);
//   rectGrad.addColorStop(1, config.badgePalette[2]);

//   ctx.save();
//   ctx.shadowColor = "rgba(0,0,0,0.45)";
//   ctx.shadowBlur = 28 * S;
//   ctx.shadowOffsetY = 8 * S;
//   ctx.fillStyle = rectGrad;
//   roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
//   ctx.fill();
//   ctx.restore();

//   // glossy overlay
//   ctx.save();
//   ctx.globalAlpha = 0.12;
//   ctx.fillStyle = "rgba(255,255,255,0.95)";
//   ctx.beginPath();
//   ctx.ellipse(
//     -badgeHalf * 0.2,
//     -badgeHalf * 0.5,
//     badgeSize * 0.7,
//     badgeSize * 0.42,
//     -0.6,
//     0,
//     Math.PI * 2
//   );
//   ctx.clip();
//   roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
//   ctx.fill();
//   ctx.restore();

//   // symbol (centered inside badge)
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "middle";
//   let symFontSize = 72 * S;
//   ctx.font = `700 ${symFontSize}px "${pf}"`;
//   while (
//     ctx.measureText(config.coinSymbol).width > badgeSize * 0.68 &&
//     symFontSize > 20 * S
//   ) {
//     symFontSize -= 2 * S;
//     ctx.font = `700 ${symFontSize}px "${pf}"`;
//   }
//   ctx.lineWidth = 2 * S;
//   ctx.strokeStyle = "rgba(0,0,0,0.25)";
//   ctx.strokeText(config.coinSymbol, 0, 0);
//   ctx.fillText(config.coinSymbol, 0, 0);

//   ctx.restore(); // badge complete

//   // Title block (centered horizontally under badge)
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "top";
//   ctx.font = `700 ${fontSize}px "${pf}"`;

//   let titleStartY = topY + badgeSize + gapBadgeToTitle;
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const lineY = Math.round(titleStartY + i * lineHeight);
//     ctx.fillText(line, W / 2, lineY);
//   }

//   // Subtitle
//   ctx.save();
//   ctx.font = `400 ${subtitleFontSize}px "${pf}"`;
//   ctx.fillStyle = "rgba(255,255,255,0.75)";
//   ctx.textAlign = "center";
//   ctx.textBaseline = "top";
//   const subtitleY = Math.round(
//     titleStartY + titleBlockHeight + gapTitleToSubtitle
//   );
//   ctx.fillText(config.subtitle, W / 2, subtitleY);
//   ctx.restore();

//   // Watermark at bottom-right (unchanged)
//   ctx.save();
//   ctx.font = `300 ${18 * S}px "${pf}"`;
//   ctx.fillStyle = "rgba(255,255,255,0.3)";
//   ctx.textAlign = "right";
//   ctx.fillText(config.watermark, W - 30 * S, H - 28 * S);
//   ctx.restore();

//   // return buffer
//   return config.format === "webp"
//     ? canvas.toBuffer("image/webp", { quality: 0.9 })
//     : canvas.toBuffer("image/png");
// }

// module.exports = generateCoinImage;

// // Example usage if run directly:
// if (require.main === module) {
//   (async () => {
//     const buf = await generateCoinImage({
//       coinSymbol: "$DOP",
//       coinName: "Data Ownership Protocol",
//       subtitle: "CoinsUpdate.org",
//       format: "png",
//     });
//     fs.writeFileSync("test-output-centered.png", buf);
//     console.log("✅ Generated test-output-centered.png");
//   })();
// }
/**
 * generate-coin-image-centered-full.js
 *
 * Centers the badge + title + subtitle in the middle of the canvas.
 * Optional: put NotoSans-Bold.ttf and NotoSans-Regular.ttf into ./fonts/
 *
 * Usage:
 *   npm install @napi-rs/canvas
 *   node generate-coin-image-centered-full.js
 */

const fs = require("fs");
const path = require("path");

let createCanvas, registerFont;
try {
  ({ createCanvas, registerFont } = require("@napi-rs/canvas"));
} catch (e1) {
  try {
    ({ createCanvas, registerFont } = require("canvas"));
  } catch (e2) {
    throw new Error(
      "Install @napi-rs/canvas or canvas: npm install @napi-rs/canvas"
    );
  }
}

// Optional font registration for stable measureText results
const fontsDir = path.join(__dirname, "fonts");
try {
  registerFont(path.join(fontsDir, "NotoSans-Bold.ttf"), {
    family: "NotoSans",
    weight: "700",
  });
  registerFont(path.join(fontsDir, "NotoSans-Regular.ttf"), {
    family: "NotoSans",
    weight: "400",
  });
} catch (err) {
  // Fonts may not exist — script will still run using system fallbacks.
  // For predictable metrics, add fonts to ./fonts directory.
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, r);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapTextNoMidWord(ctx, text, maxWidth) {
  // Break only at spaces; never split words.
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      line = testLine;
    } else {
      if (line) lines.push(line);
      // If a single word is longer than maxWidth, keep it as-is (font autoscaling should prevent this).
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function generateCoinImage(opts = {}) {
  const config = Object.assign(
    {
      width: 1200,
      height: 630,
      scale: 2,
      coinSymbol: "$Coin",
      coinName: "Coin Name",
      primaryFont: "NotoSans",
      format: "png", // png | webp
      watermark: "https://coinsupdate.org",
      badgePalette: ["#17c3b2", "#0a6fb2", "#003f7f"],
      subtitle: "new listing",
      maxTitleLines: 3,
    },
    opts
  );

  const { width, height, scale, primaryFont: pf } = config;
  const W = Math.round(width * scale);
  const H = Math.round(height * scale);
  const S = scale;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // ----- Background gradient -----
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f1724");
  grad.addColorStop(0.5, "#0b1220");
  grad.addColorStop(1, "#051426");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal stripes
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = "#ffffff";
  const stripeW = 60 * S;
  for (let x = -W; x < W * 2; x += stripeW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW / 2, 0);
    ctx.lineTo(x - W, H);
    ctx.lineTo(x - W - stripeW / 2, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ----- Badge params (we will center the whole block) -----
  const badgeSize = 260 * S;
  const badgeRadius = 30 * S;
  const badgeHalf = badgeSize / 2;

  // ----- Title autoscale + wrapping -----
  // We'll try a high font size and reduce until the title block fits max width and lines.
  const maxTextWidth = Math.min(800 * S, W * 0.72); // up to 72% of width
  let fontSize = 90 * S;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let lines = [];
  // reduce until fit
  while (fontSize >= 32 * S) {
    ctx.font = `700 ${fontSize}px "${pf}"`;
    const nameLower = config.coinName.toLowerCase();
    if (nameLower.includes("ownership protocol")) {
      lines = ["Data Ownership", "Protocol"];
    } else if (nameLower.includes("coinmarketcap")) {
      lines = ["CoinMarketCap", "Listing"];
    } else {
      lines = wrapTextNoMidWord(ctx, config.coinName, maxTextWidth);
    }

    const tooWide = lines.some(
      (ln) => ctx.measureText(ln).width > maxTextWidth
    );
    if (!tooWide && lines.length <= config.maxTitleLines) break;
    fontSize -= 4 * S;
  }
  // final font set
  ctx.font = `700 ${fontSize}px "${pf}"`;
  const lineHeight = fontSize * 1.15;

  // subtitle size
  const subtitleFontSize = Math.round(28 * S);
  ctx.font = `400 ${subtitleFontSize}px "${pf}"`;
  const subtitleHeight = subtitleFontSize * 1.2;

  // gaps
  const gapBadgeToTitle = 24 * S;
  const gapTitleToSubtitle = 18 * S;
  const titleBlockHeight = lines.length * lineHeight;
  const totalBlockHeight =
    badgeSize +
    gapBadgeToTitle +
    titleBlockHeight +
    gapTitleToSubtitle +
    subtitleHeight;

  // Top Y so the block is vertically centered
  const centerX = Math.round(W / 2);
  const centerY = Math.round(H / 2);
  const topY = Math.round(centerY - totalBlockHeight / 2);

  // ----- Draw centered badge (no rotation for balanced centered composition) -----
  const badgeCenterX = centerX;
  const badgeCenterY = topY + badgeHalf;

  ctx.save();
  ctx.translate(badgeCenterX, badgeCenterY);

  const rectGrad = ctx.createLinearGradient(
    -badgeHalf,
    -badgeHalf,
    badgeHalf,
    badgeHalf
  );
  rectGrad.addColorStop(0, config.badgePalette[0]);
  rectGrad.addColorStop(0.6, config.badgePalette[1]);
  rectGrad.addColorStop(1, config.badgePalette[2]);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 28 * S;
  ctx.shadowOffsetY = 8 * S;
  ctx.fillStyle = rectGrad;
  roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
  ctx.fill();
  ctx.restore();

  // glossy overlay
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.ellipse(
    -badgeHalf * 0.2,
    -badgeHalf * 0.5,
    badgeSize * 0.7,
    badgeSize * 0.42,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.clip();
  roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
  ctx.fill();
  ctx.restore();

  // symbol centered inside badge
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let symFontSize = 72 * S;
  ctx.font = `700 ${symFontSize}px "${pf}"`;
  while (
    ctx.measureText(config.coinSymbol).width > badgeSize * 0.68 &&
    symFontSize > 20 * S
  ) {
    symFontSize -= 2 * S;
    ctx.font = `700 ${symFontSize}px "${pf}"`;
  }
  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.strokeText(config.coinSymbol, 0, 0);
  ctx.fillText(config.coinSymbol, 0, 0);

  ctx.restore(); // badge finished

  // ----- Draw title block centered under badge -----
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `700 ${fontSize}px "${pf}"`;

  const titleStartY = topY + badgeSize + gapBadgeToTitle;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineY = Math.round(titleStartY + i * lineHeight);
    ctx.fillText(line, centerX, lineY);
  }

  // subtitle
  ctx.save();
  ctx.font = `400 ${subtitleFontSize}px "${pf}"`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const subtitleY = Math.round(
    titleStartY + titleBlockHeight + gapTitleToSubtitle
  );
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(config.subtitle, centerX, subtitleY);
  ctx.restore();

  // watermark bottom-right
  ctx.save();
  ctx.font = `300 ${18 * S}px "${pf}"`;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "right";
  ctx.fillText(config.watermark, W - 30 * S, H - 28 * S);
  ctx.restore();

  // return buffer
  return config.format === "webp"
    ? canvas.toBuffer("image/webp", { quality: 0.9 })
    : canvas.toBuffer("image/png");
}

module.exports = generateCoinImage;

// Example direct run - writes centered image to disk
if (require.main === module) {
  (async () => {
    const buf = await generateCoinImage({
      coinSymbol: "$DOP",
      coinName: "Data Ownership Protocol",
      subtitle: "CoinsUpdate.org",
      format: "png",
    });
    fs.writeFileSync("test-output-centered-full.png", buf);
    console.log("✅ Generated test-output-centered-full.png");
  })();
}
