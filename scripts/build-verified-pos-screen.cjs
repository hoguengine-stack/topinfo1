const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const officialUiPath = path.join(
  projectRoot,
  ".asset-research",
  "official-toss-pos-ui",
  "place-pos-device-mobile-order-mockup.png",
);
const outputScreenPath = path.join(
  projectRoot,
  "public",
  "assets",
  "product",
  "toss-pos-screen-verified.png",
);

const SOURCE_RULES = {
  officialUi: {
    url: "https://static.toss.im/illusts/place-pos-device-mobile-order-mockup.png",
    width: 4000,
    height: 1700,
    sha256: "66864ee53a0cd1b2078f32b6f75c3b9ade9b294ef49040fae4c92bd062846b49",
  },
  outputScreen: { width: 1288, height: 975 },
  kioskLabel: "키오스크 ON",
  totalQuantity: 6,
};

const SCREEN_LAYOUT = {
  centralScreen: { left: 1433, top: 264, width: 1288, height: 975 },
  cleanRightPanel: { left: 1058, top: 734, width: 327, height: 671 },
  rightPanelTarget: { left: 864, top: 76, width: 424, height: 899 },
  quantityPatch: { left: 1017, top: 887, width: 74, height: 63 },
};

async function assertSource(filePath, rule, label) {
  const [fileBuffer, metadata] = await Promise.all([
    fs.readFile(filePath),
    sharp(filePath).metadata(),
  ]);
  const actualHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  if (actualHash !== rule.sha256) {
    throw new Error(`${label} SHA-256 mismatch. Re-verify the official visual before rebuilding.`);
  }
  if (metadata.width !== rule.width || metadata.height !== rule.height) {
    throw new Error(
      `${label} dimensions changed: ${metadata.width}x${metadata.height}, expected ${rule.width}x${rule.height}.`,
    );
  }
}

async function buildVerifiedScreen() {
  await assertSource(officialUiPath, SOURCE_RULES.officialUi, "Official Toss POS source");

  const centralScreen = await sharp(officialUiPath)
    .extract(SCREEN_LAYOUT.centralScreen)
    .png()
    .toBuffer();

  // The official lineup overlaps the central screen with another device. Restore only
  // that covered order panel from the same UI state shown on the unobstructed laptop.
  const cleanRightPanel = await sharp(officialUiPath)
    .extract(SCREEN_LAYOUT.cleanRightPanel)
    .resize({
      width: SCREEN_LAYOUT.rightPanelTarget.width,
      height: SCREEN_LAYOUT.rightPanelTarget.height,
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const quantityBadge = Buffer.from(`
    <svg width="74" height="63" xmlns="http://www.w3.org/2000/svg">
      <rect width="74" height="63" fill="#3182F6" />
      <circle cx="33" cy="31.5" r="21" fill="#ffffff" />
      <text
        x="33"
        y="39.5"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="24"
        font-weight="700"
        fill="#3182F6"
      >${SOURCE_RULES.totalQuantity}</text>
    </svg>
  `);

  await sharp(centralScreen)
    .composite([
      {
        input: cleanRightPanel,
        left: SCREEN_LAYOUT.rightPanelTarget.left,
        top: SCREEN_LAYOUT.rightPanelTarget.top,
      },
      {
        input: quantityBadge,
        left: SCREEN_LAYOUT.quantityPatch.left,
        top: SCREEN_LAYOUT.quantityPatch.top,
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputScreenPath);

  const outputMetadata = await sharp(outputScreenPath).metadata();
  if (
    outputMetadata.width !== SOURCE_RULES.outputScreen.width
    || outputMetadata.height !== SOURCE_RULES.outputScreen.height
  ) {
    throw new Error("Verified screen output dimensions changed unexpectedly.");
  }

  console.log([
    outputScreenPath,
    `verified kiosk label: ${SOURCE_RULES.kioskLabel}`,
    `verified total quantity: ${SOURCE_RULES.totalQuantity}`,
    `official source: ${SOURCE_RULES.officialUi.url}`,
  ].join("\n"));
}

buildVerifiedScreen().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
