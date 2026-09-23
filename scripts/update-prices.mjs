// scripts/update-prices.mjs
// Automatsko ažuriranje cijena iz javnog F1 Fantasy feeda (bez logina).
// Feed: https://fantasy.formula1.com/feeds/drivers/{GAMEDAY}_en.json
//   - GAMEDAY = redni broj utrke; uzimamo NAJVIŠI koji postoji (= aktualne cijene)
//   - Data.Value[]: vozači (PositionName "DRIVER") i konstruktori ("CONSTRUCTOR")
//   - cijena = Value, kod = DriverTLA
// Sigurnosni princip: radije NE napraviti ništa nego upisati krive cijene.

import { readFileSync, writeFileSync } from "node:fs";

const CONSTANTS_PATH = "lib/constants.ts";
const FEED = n => `https://fantasy.formula1.com/feeds/drivers/${n}_en.json`;
const MAX_GAMEDAY = 30;

// Konstruktor TLA iz feeda → naš id
const CONSTR_TLA = {
  MER:"mercedes", MCL:"mclaren", RBR:"redbull", FER:"ferrari", ALP:"alpine",
  WIL:"williams", AST:"aston", AMR:"aston", HAA:"haas", AUD:"audi",
  RBS:"rb", VRB:"rb", CAD:"cadillac",
};

async function fetchFeed(n) {
  try {
    const res = await fetch(FEED(n), {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (price-sync)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { status: res.status };
    const json = await res.json();
    const list = json?.Data?.Value;
    return Array.isArray(list) && list.length ? { status: 200, list, feedTime: json?.Data?.FeedTime?.UTCTime } : { status: "empty" };
  } catch (e) { return { status: e.message }; }
}

// ── 1. Pronađi najnoviji gameday feed ────────────────────────────────────────
console.log("=== F1 Fantasy price sync ===");
let latest = null, misses = 0;
for (let n = 1; n <= MAX_GAMEDAY; n++) {
  const r = await fetchFeed(n);
  if (r.status === 200) { latest = { n, ...r }; misses = 0; }
  else if (latest && ++misses >= 2) break;   // 2 uzastopna promašaja nakon zadnjeg valjanog → kraj
}
if (!latest) { console.error("FAIL: nijedan gameday feed nije dostupan. Cijene NISU mijenjane."); process.exit(1); }
console.log(`Najnoviji feed: gameday ${latest.n} (FeedTime UTC: ${latest.feedTime ?? "?"}) — ${FEED(latest.n)}`);

// ── 2. Parsiranje ────────────────────────────────────────────────────────────
const driverPrices = {}, teamPrices = {}, unknown = [];
for (const p of latest.list) {
  const tla = String(p?.DriverTLA ?? "").toUpperCase();
  const price = parseFloat(p?.Value);
  if (!tla || isNaN(price)) continue;
  if (p?.PositionName === "DRIVER") driverPrices[tla] = price;
  else if (p?.PositionName === "CONSTRUCTOR") {
    const id = CONSTR_TLA[tla];
    if (id) teamPrices[id] = price; else unknown.push(`konstruktor ${tla} (${p?.FUllName})`);
  }
}
console.log(`Iz feeda: ${Object.keys(driverPrices).length} vozača, ${Object.keys(teamPrices).length} konstruktora`);

// ── 3. Sanity guard ──────────────────────────────────────────────────────────
const constantsSrc = readFileSync(CONSTANTS_PATH, "utf-8").split("\n");
const expectedDrivers = constantsSrc.filter(l => l.includes("driverNumber"))
  .map(l => l.match(/shortName:\s*"([A-Z]+)"/)?.[1]).filter(Boolean);
const expectedTeams = constantsSrc.filter(l => l.includes("drivers: ["))
  .map(l => l.match(/id:\s*"([a-z]+)"/)?.[1]).filter(Boolean);

let unavailable = [];
try {
  const m = readFileSync("app/api/predict/route.ts", "utf-8")
    .match(/UNAVAILABLE_DRIVERS\s*=\s*new Set<string>\(\[([^\]]*)\]\)/);
  unavailable = m ? [...m[1].matchAll(/"([A-Z]+)"/g)].map(x => x[1]) : [];
} catch {}

console.log(`Očekivano: ${expectedDrivers.length} vozača (smiju nedostajati: ${unavailable.join(",") || "—"}), ${expectedTeams.length} konstruktora`);

for (const tla of Object.keys(driverPrices))
  if (!expectedDrivers.includes(tla)) unknown.push(`vozač ${tla}`);

const missingDrivers = expectedDrivers.filter(c => !(c in driverPrices) && !unavailable.includes(c));
const missingTeams   = expectedTeams.filter(id => !(id in teamPrices));
const outOfRange = [...Object.values(driverPrices), ...Object.values(teamPrices)].filter(p => p < 1 || p > 45);

const errors = [];
if (missingDrivers.length) errors.push(`vozači bez cijene u feedu: ${missingDrivers.join(", ")}`);
if (missingTeams.length)   errors.push(`konstruktori bez cijene u feedu: ${missingTeams.join(", ")}`);
if (outOfRange.length)     errors.push(`cijene izvan raspona 1-45: ${outOfRange.join(", ")}`);
if (errors.length) { console.error(`FAIL — cijene NISU mijenjane:\n  - ${errors.join("\n  - ")}`); process.exit(1); }
if (unknown.length) console.log(`::warning::Feed sadrži unose kojih nema u rosteru (nova supstitucija?): ${unknown.join(", ")}`);

// ── 4. Upis u constants.ts ───────────────────────────────────────────────────
let content = readFileSync(CONSTANTS_PATH, "utf-8");
const before = content;
const changes = [];

content = content.split("\n").map(line => {
  const d = line.includes("driverNumber") && line.match(/shortName:\s*"([A-Z]+)"/)?.[1];
  const t = line.includes("drivers: [") && line.match(/id:\s*"([a-z]+)"/)?.[1];
  const newPrice = d ? driverPrices[d] : t ? teamPrices[t] : undefined;
  if (newPrice === undefined) return line;
  const old = parseFloat(line.match(/price:\s*([\d.]+)/)?.[1]);
  if (old !== newPrice) changes.push(`${d || t}: ${old} → ${newPrice}`);
  return line.replace(/price:\s*[\d.]+/, `price: ${newPrice.toFixed(1)}`);
}).join("\n");

if (!changes.length) { console.log("Nema promjena cijena — ništa za commitati."); process.exit(0); }

const dateStr = new Date().toLocaleDateString("hr-HR", { day:"2-digit", month:"2-digit", year:"numeric" });
content = content.replace(/\/\/ Zadnje ažuriranje:[^\n]*/, `// Zadnje ažuriranje: ${dateStr} (auto-sync, gameday ${latest.n})`);

writeFileSync(CONSTANTS_PATH, content);
console.log(`✓ Promijenjeno ${changes.length} cijena:\n  ${changes.join("\n  ")}`);
