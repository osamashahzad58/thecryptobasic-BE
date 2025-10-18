/**
 * generate-coin-image.js
 *
 * Returns image buffer instead of saving file.
 * Supports PNG or WEBP output.
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

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

async function generateCoinImage(opts = {}) {
  const config = Object.assign(
    {
      width: 1200,
      height: 630,
      scale: 2,
      coinSymbol: "$Coin",
      coinName: "Coin Name",
      primaryFont: "Noto Sans, Arial, Helvetica, sans-serif",
      format: "png", // png | webp
      watermark: "https://coinsupdate.org",
      badgePalette: ["#17c3b2", "#0a6fb2", "#003f7f"],
    },
    opts
  );

  const { width, height, scale, primaryFont: pf } = config;
  const W = Math.round(width * scale);
  const H = Math.round(height * scale);
  const S = scale;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const coinSymbol = config.coinSymbol;
  const coinName = config.coinName;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f1724");
  grad.addColorStop(0.5, "#0b1220");
  grad.addColorStop(1, "#051426");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle stripes
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

  // Badge
  const badgeSize = 260 * S;
  const badgeRadius = 30 * S;
  const badgeCenterX = 220 * S;
  const badgeCenterY = H / 2;
  const badgeHalf = badgeSize / 2;

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

  ctx.save();
  ctx.translate(badgeCenterX, badgeCenterY);
  ctx.rotate(-12 * (Math.PI / 180));

  // gradient fill
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

  // monogram (symbol)
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxBadgeInner = badgeSize * 0.68;
  let symFontSize = 72 * S;
  ctx.font = `700 ${symFontSize}px ${pf}`;
  let symbolWidth = ctx.measureText(coinSymbol).width;

  while (symbolWidth > maxBadgeInner && symFontSize > 20 * S) {
    symFontSize -= 2 * S;
    ctx.font = `700 ${symFontSize}px ${pf}`;
    symbolWidth = ctx.measureText(coinSymbol).width;
  }

  ctx.lineWidth = 2 * S;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.strokeText(coinSymbol, 0, 0);
  ctx.fillText(coinSymbol, 0, 0);
  ctx.restore();
  ctx.restore();

  // Title
  const textX = 480 * S;
  const textY = H / 2 - 20 * S;
  const maxTextWidth = 600 * S;
  let fontSize = 90 * S;
  ctx.font = `700 ${fontSize}px ${pf}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  function wrapText(text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const testLine = line + word + " ";
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth && line) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  }

  let lines = wrapText(coinName, maxTextWidth);
  const totalHeight = lines.length * (fontSize + 5 * S);
  let y = textY - totalHeight / 4;
  for (const line of lines) {
    ctx.fillText(line, textX, y);
    y += fontSize + 5 * S;
  }

  // Subheading
  ctx.save();
  ctx.font = `400 ${28 * S}px ${pf}`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("new listing", textX, y + 20 * S);
  ctx.restore();

  // Watermark
  ctx.save();
  ctx.font = `300 ${18 * S}px ${pf}`;
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "right";
  ctx.fillText(config.watermark, W - 30 * S, H - 28 * S);
  ctx.restore();

  // Return buffer instead of writing to file
  let buffer;
  try {
    if (config.format === "webp") {
      buffer = canvas.toBuffer("image/webp", { quality: 0.9 });
    } else {
      buffer = canvas.toBuffer("image/png");
    }
  } catch {
    buffer = canvas.toBuffer("image/png");
  }

  return buffer;
}

module.exports = generateCoinImage;

// Example usage if called directly:
if (require.main === module) {
  (async () => {
    const buf = await generateCoinImage({
      coinSymbol: "$DOP",
      coinName: "Data Ownership Protocol",
      format: "png",
    });
    fs.writeFileSync("test-output.png", buf);
    console.log("✅ Generated test-output.png");
  })();
}
