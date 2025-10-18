/**
 * generate-coin-image.js
 *
 * Features:
 * - Retina output (scale = 2) for crisp Open Graph images
 * - CLI options: --symbol, --name, --out, --format, --width, --height, --scale
 * - Optional font registration: put fonts in ./fonts and script will register them if found
 * - Teal/blue badge (rotated rounded-square) with subtle network nodes
 * - Dynamic spacing between title and subheading
 * - SEO-friendly filename and alt text suggestion printed to console
 *
 * Usage:
 *  node generate-coin-image.js --symbol="$Dop" --name="Data ownership protocol" --out="./public/og" --format=webp
 *
 * If you want CLI arg parsing with minimist, install `npm i minimist` and the script will use it automatically.
 */

const fs = require("fs");
const path = require("path");

// try @napi-rs/canvas then canvas (node-canvas)
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

// --- Simple CLI parsing (no dependency required) ---
function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

// --- Utilities ---
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}

// if you add fonts to ./fonts, register them here for consistent rendering
function tryRegisterFonts() {
  try {
    const fontsDir = path.join(__dirname, "fonts");
    if (!fs.existsSync(fontsDir)) return;
    const files = fs.readdirSync(fontsDir);
    for (const f of files) {
      const full = path.join(fontsDir, f);
      if (/\.ttf$/i.test(f) || /\.otf$/i.test(f)) {
        // register with family name derived from file name (basic)
        const family = path.parse(f).name;
        try {
          registerFont && registerFont(full, { family });
          // also register again under generic name SiteSans for fallback use
          registerFont && registerFont(full, { family: "SiteSans" });
        } catch (err) {
          // ignore registration errors
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

tryRegisterFonts();

// --- Main generator ---
async function generateCoinImage(opts = {}) {
  const defaults = {
    width: 1200,
    height: 630,
    scale: 2, // retina multiplier (2 recommended)
    coinSymbol: "$ownership",
    coinName: "Data ownership protocol",
    outDir: path.join(__dirname, "images"),
    format: "png", // png | webp
    primaryFont: "SiteSans, Noto Sans, Arial, Helvetica, sans-serif", // register fonts to use SiteSans
    watermark: "https://coinsupdate.org",
    badgePalette: ["#17c3b2", "#0a6fb2", "#003f7f"], // teal -> blue -> navy
  };

  const config = Object.assign({}, defaults, opts);

  // dimensions with scaling
  const W = Math.round(config.width * config.scale);
  const H = Math.round(config.height * config.scale);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const pf = config.primaryFont;
  const coinSymbol = config.coinSymbol;
  const coinName = config.coinName;

  // helpers scaled
  const S = config.scale;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0f1724");
  grad.addColorStop(0.5, "#0b1220");
  grad.addColorStop(1, "#051426");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal stripes for texture
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = "#ffffff";
  const stripeW = Math.round(60 * S);
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

  // ---------- Badge (rotated rounded-square) ----------
  const badgeSize = Math.round(260 * S);
  const badgeRadius = Math.round(30 * S);
  const badgeCenterX = Math.round(220 * S);
  const badgeCenterY = Math.round(H / 2);
  const badgeHalf = Math.round(badgeSize / 2);

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

  // badge gradient
  const rectGrad = ctx.createLinearGradient(
    -badgeHalf,
    -badgeHalf,
    badgeHalf,
    badgeHalf
  );
  rectGrad.addColorStop(0, config.badgePalette[0]);
  rectGrad.addColorStop(0.6, config.badgePalette[1]);
  rectGrad.addColorStop(1, config.badgePalette[2]);

  // subtle drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(28 * S);
  ctx.shadowOffsetY = Math.round(8 * S);
  ctx.fillStyle = rectGrad;
  roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
  ctx.fill();
  ctx.restore();

  // glossy overlay (soft highlight)
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  const highlightW = badgeSize * 0.7;
  ctx.ellipse(
    -badgeHalf * 0.2,
    -badgeHalf * 0.5,
    highlightW,
    badgeSize * 0.42,
    -0.6,
    0,
    Math.PI * 2
  );
  ctx.clip();
  roundRect(ctx, -badgeHalf, -badgeHalf, badgeSize, badgeSize, badgeRadius);
  ctx.fill();
  ctx.restore();

  // outer ring
  ctx.save();
  ctx.lineWidth = Math.round(6 * S);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundRect(
    ctx,
    -badgeHalf + Math.round(4 * S),
    -badgeHalf + Math.round(4 * S),
    badgeSize - Math.round(8 * S),
    badgeSize - Math.round(8 * S),
    Math.max(2, badgeRadius - Math.round(2 * S))
  );
  ctx.stroke();
  ctx.restore();

  // network nodes
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = Math.max(1, Math.round(2 * S));
  const nodes = [
    { x: -badgeHalf * 0.38, y: -badgeHalf * 0.15 },
    { x: -badgeHalf * 0.05, y: -badgeHalf * 0.45 },
    { x: badgeHalf * 0.35, y: -badgeHalf * 0.12 },
    { x: badgeHalf * 0.18, y: badgeHalf * 0.28 },
    { x: -badgeHalf * 0.28, y: badgeHalf * 0.42 },
  ];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if ((i + j) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }
  for (const n of nodes) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.arc(n.x, n.y, Math.max(3, Math.round(6 * S)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // monogram
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxBadgeInner = badgeSize * 0.68;
  let symFontSize = Math.round(72 * S);
  ctx.font = `700 ${symFontSize}px ${pf}`;
  let symbolWidth = ctx.measureText(coinSymbol).width;

  while (symbolWidth > maxBadgeInner && symFontSize > Math.round(18 * S)) {
    symFontSize -= Math.round(2 * S);
    ctx.font = `700 ${symFontSize}px ${pf}`;
    symbolWidth = ctx.measureText(coinSymbol).width;
  }

  let symbolLines = [coinSymbol];

  if (symbolWidth > maxBadgeInner) {
    const splitCandidates = coinSymbol.split(/([^\w$]+)/).filter(Boolean);
    if (splitCandidates.length > 1) {
      const halfway = Math.ceil(splitCandidates.length / 2);
      symbolLines = [
        splitCandidates.slice(0, halfway).join(""),
        splitCandidates.slice(halfway).join(""),
      ];
    } else {
      const mid = Math.ceil(coinSymbol.length / 2);
      symbolLines = [coinSymbol.slice(0, mid), coinSymbol.slice(mid)];
    }

    let attempt = symFontSize;
    ctx.font = `700 ${attempt}px ${pf}`;
    const fits = () =>
      symbolLines.every((l) => ctx.measureText(l).width <= maxBadgeInner);
    while (!fits() && attempt > Math.round(18 * S)) {
      attempt -= Math.round(2 * S);
      ctx.font = `700 ${attempt}px ${pf}`;
    }
    symFontSize = attempt;
  }

  if (
    symbolLines.length === 1 &&
    ctx.measureText(symbolLines[0]).width > maxBadgeInner
  ) {
    let s = symbolLines[0];
    while (s.length > 1 && ctx.measureText(s + "…").width > maxBadgeInner) {
      s = s.slice(0, -1);
    }
    symbolLines = [s + "…"];
  }

  ctx.font = `700 ${symFontSize}px ${pf}`;
  const monoLineHeight = Math.round(symFontSize * 1.05);
  const monoStartY = Math.round(
    -(monoLineHeight * (symbolLines.length - 1)) / 2
  );
  for (let i = 0; i < symbolLines.length; i++) {
    // subtle stroke to make whites pop on busy backgrounds
    ctx.lineWidth = Math.max(1, Math.round(2 * S));
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.strokeText(symbolLines[i], 0, monoStartY + i * monoLineHeight);
    ctx.fillText(symbolLines[i], 0, monoStartY + i * monoLineHeight);
  }
  ctx.restore();
  ctx.restore();
  // ---------- end badge ----------

  // --- Title & layout ---
  // positions (unscaled logical values multiplied by S where appropriate earlier)
  const textX = Math.round(480 * S);
  const textY = Math.round(H / 2 - 20 * S);
  const maxTextWidth = Math.round(600 * S);
  let titleFontSize = Math.round(90 * S);

  function wrapTextToLines(text, maxW, fontSpec) {
    ctx.font = fontSpec;
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const testLine = line ? line + " " + word : word;
      const { width: tw } = ctx.measureText(testLine);
      if (tw > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  let titleLines;
  do {
    ctx.font = `700 ${titleFontSize}px ${pf}`;
    titleLines = wrapTextToLines(
      coinName,
      maxTextWidth,
      `700 ${titleFontSize}px ${pf}`
    );
    if (titleLines.length > 2)
      titleFontSize = Math.max(
        Math.round(40 * S),
        titleFontSize - Math.round(2 * S)
      );
    else break;
  } while (titleFontSize > Math.round(40 * S));

  // Draw title
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = Math.round(20 * S);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${titleFontSize}px ${pf}`;

  const totalTitleHeight =
    titleLines.length * (titleFontSize + Math.round(5 * S));
  let y = textY - Math.round(totalTitleHeight / 4);
  for (const line of titleLines) {
    ctx.fillText(line, textX, y);
    y += titleFontSize + Math.round(5 * S);
  }
  ctx.restore();

  // Subheading positioned dynamically below title
  const subheadingGap = Math.max(
    Math.round(18 * S),
    Math.round(titleFontSize * 0.35)
  );
  const subheadingY = y + subheadingGap;
  ctx.save();
  ctx.font = `400 ${Math.round(28 * S)}px ${pf}`;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("new listing", textX, subheadingY);
  ctx.restore();

  // Watermark (muted)
  ctx.save();
  ctx.font = `300 ${Math.round(18 * S)}px ${pf}`;
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.textAlign = "right";
  ctx.fillText(
    config.watermark,
    W - Math.round(30 * S),
    H - Math.round(28 * S)
  );
  ctx.restore();

  // --- Save file ---
  if (!fs.existsSync(config.outDir))
    fs.mkdirSync(config.outDir, { recursive: true });
  const safeName = `${slugify(coinName)}-${slugify(coinSymbol)}-${Date.now()}`;
  const outExt = config.format === "webp" ? "webp" : "png";
  const outPath = path.join(config.outDir, `${safeName}.${outExt}`);

  let buffer;
  try {
    if (config.format === "webp") {
      // some canvas builds support webp
      buffer = canvas.toBuffer("image/webp", { quality: 0.9 });
    } else {
      buffer = canvas.toBuffer("image/png");
    }
  } catch (err) {
    // fallback to png
    buffer = canvas.toBuffer("image/png");
  }
  fs.writeFileSync(outPath, buffer);

  // Print helpful metadata
  console.log("✅ Image saved:", outPath);
  console.log("ALT suggestion:", `${coinName} (${coinSymbol}) — New listing`);
  return {
    path: outPath,
    width: config.width,
    height: config.height,
    scale: config.scale,
  };
}

// --- If run directly from CLI ---
if (require.main === module) {
  (async () => {
    try {
      const argv = parseArgs(process.argv.slice(2));
      const info = {
        coinSymbol: argv.symbol || argv.s || "$Data ownership protocol",
        coinName: argv.name || argv.n || "Data ownership protocol",
        outDir: argv.out || argv.o || path.join(__dirname, "images"),
        format: (argv.format || argv.f || "png").toLowerCase(),
        width: argv.width ? parseInt(argv.width, 10) : 1200,
        height: argv.height ? parseInt(argv.height, 10) : 630,
        scale: argv.scale ? parseFloat(argv.scale) : 2,
      };

      // safety: clamp scale to reasonable values
      if (info.scale <= 0 || info.scale > 4) info.scale = 2;

      await generateCoinImage(info);
    } catch (err) {
      console.error("✖ failed:", err);
      process.exit(1);
    }
  })();
}

module.exports = generateCoinImage;
