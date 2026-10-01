// Builds dist/index.html: the dashboard with its data embedded, encrypted with a passphrase.
// The passphrase is read from the DASHBOARD_PASSPHRASE environment variable and is never written to disk.
import { readFileSync, writeFileSync, mkdirSync, rmSync, renameSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

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
const insights = existsSync("data/insights.json") ? JSON.parse(readFileSync("data/insights.json", "utf8")) : null;

// Escape "<" so embedded JSON can never close the script tag.
const embedded = JSON.stringify({ ads, insights }).replace(/</g, "\\u003c");
const html = readFileSync("index.html", "utf8").replace(
  "<script>",
  `<script>window.__DATA__ = ${embedded};</script>\n<script>`
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
