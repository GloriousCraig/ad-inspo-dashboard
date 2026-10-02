// Builds dist/index.html: the dashboard with its data embedded, encrypted with a passphrase.
// The passphrase is read from the DASHBOARD_PASSPHRASE environment variable and is never written to disk.
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const passphrase = process.env.DASHBOARD_PASSPHRASE;
if (!passphrase) {
  console.error("DASHBOARD_PASSPHRASE is not set. Refusing to build an unencrypted page.");
  process.exit(1);
}
if (passphrase.length < 16) {
  console.error("DASHBOARD_PASSPHRASE is shorter than 16 characters. Use a longer passphrase.");
  process.exit(1);
}

const ads = JSON.parse(readFileSync("data/ads.json", "utf8"));

// Screenshots: data/images/<ad id>.<ext>. Each is shrunk to a small JPEG thumbnail and embedded in the
// encrypted page, so it is only visible after the passphrase is entered.
const imgDir = "data/images";
const imgFiles = existsSync(imgDir) ? readdirSync(imgDir) : [];
let embedded_images = 0;
for (const a of ads.ads || []) {
  const id = String(a.ID ?? a.Id ?? "");
  const file = imgFiles.find((n) => n.split(".")[0] === id);
  if (!file) continue;
  try {
    const buf = await sharp(`${imgDir}/${file}`)
      .rotate()
      .resize({ width: 640, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 72 })
      .toBuffer();
    a._image = "data:image/jpeg;base64," + buf.toString("base64");
    embedded_images++;
  } catch (e) {
    console.warn(`Could not process the image for ad ${id}: ${e.message}`);
  }
}
console.log(`Embedded ${embedded_images} screenshot thumbnail(s).`);
const insights = existsSync("data/insights.json") ? JSON.parse(readFileSync("data/insights.json", "utf8")) : null;

// Escape "<" so embedded JSON can never close the script tag.
const embedded = JSON.stringify({ ads, insights }).replace(/</g, "\\u003c");
const html = readFileSync("index.html", "utf8").replace(
  "<script>",
  () => `<script>window.__DATA__ = ${embedded};</script>\n<script>`
);

rmSync("build", { recursive: true, force: true });
rmSync("dist", { recursive: true, force: true });
mkdirSync("build", { recursive: true });
mkdirSync("dist", { recursive: true });
writeFileSync("build/plain.html", html);

const result = spawnSync(
  process.execPath,
  [
    "node_modules/staticrypt/cli/index.js",
    "build/plain.html",
    "-d", "dist",
    "-c", "false",
    "--remember", "30",
    "--template-title", "Ad Inspo Library",
    "--template-instructions", "Enter the team passphrase to view the dashboard.",
    "--template-button", "Open"
  ],
  { stdio: "inherit", env: { ...process.env, STATICRYPT_PASSWORD: passphrase } }
);
if (result.status !== 0) process.exit(result.status ?? 1);

renameSync("dist/plain.html", "dist/index.html");
rmSync("build", { recursive: true, force: true });
console.log("Built dist/index.html (encrypted).");
