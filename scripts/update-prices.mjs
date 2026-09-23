// scripts/update-prices.mjs
// Automatsko ažuriranje cijena iz F1 Fantasy javnog API-ja (bez logina).
// Pokreće ga GitHub Actions svaki četvrtak (+ ručno preko workflow_dispatch).
// Sigurnosni princip: radije NE napraviti ništa nego upisati krive cijene.

import { readFileSync, writeFileSync } from "node:fs";

const YEAR = new Date().getFullYear();
const CONSTANTS_PATH = "lib/constants.ts";

// ── Kandidat-endpointi (F1 povremeno mijenja platformu — probamo redom) ──────
const DRIVER_ENDPOINTS = [
  `https://fantasy-api.formula1.com/f1/${YEAR}/players`,
  `https://fantasy-api.formula1.com/partner_games/f1/players`,
  `https://fantasy.formula1.com/feeds/drivers/1_en.json`,
];
const TEAM_ENDPOINTS = [
  `https://fantasy-api.formula1.com/f1/${YEAR}/teams`,
  `https://fantasy-api.formula1.com/partner_games/f1/teams`,
  `https://fantasy.formula1.com/feeds/constructors/1_en.json`,
];

// ── Mapiranja imena → naši kodovi ────────────────────────────────────────────
const LASTNAME_TO_CODE = {
  norris:"NOR", piastri:"PIA", russell:"RUS", antonelli:"ANT",
  leclerc:"LEC", hamilton:"HAM", verstappen:"VER", hadjar:"HAD",
  albon:"ALB", sainz:"SAI", lawson:"LAW", lindblad:"LIN",
  alonso:"ALO", stroll:"STR", ocon:"OCO", bearman:"BEA",
  hulkenberg:"HUL", "hülkenberg":"HUL", bortoleto:"BOR",
  gasly:"GAS", colapinto:"COL", perez:"PER", "pérez":"PER",
  bottas:"BOT", tsunoda:"TSU",
};
const TEAMNAME_TO_ID = [
  [/mclaren/i, "mclaren"], [/mercedes/i, "mercedes"], [/ferrari/i, "ferrari"],
  [/red\s*bull(?!s)/i, "redbull"], [/williams/i, "williams"],
  [/racing\s*bulls|^rb\b|visa|vcarb/i, "rb"], [/aston/i, "aston"],
  [/haas/i, "haas"], [/audi|sauber|kick/i, "audi"], [/alpine/i, "alpine"],
  [/cadillac/i, "cadillac"],
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function tryFetch(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (price-sync)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { console.log(`  ${url} → HTTP ${res.status}`); continue; }
      const data = await res.json();
      console.log(`  ${url} → OK`);
      return data;
    } catch (e) { console.log(`  ${url} → ${e.message}`); }
  }
  return null;
}

// Izvuci listu objekata iz raznih omotača ({players:[...]}, {data:[...]}, [...])
function extractList(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["players", "drivers", "teams", "constructors", "data", "results"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return null;
}

// Cijena se kroz sezone zvala raznim imenima
function extractPrice(obj) {
  for (const key of ["price", "curr_price", "current_price", "cost", "now_cost", "player_value", "value"]) {
    const v = parseFloat(obj?.[key]);
    if (!isNaN(v) && v > 0) return v;
  }
  return null;
}
function extractName(obj) {
  return obj?.last_name ?? obj?.lastName ?? obj?.display_name ?? obj?.name ?? obj?.full_name ?? "";
}

function updateLine(content, marker, matchKey, newPrice) {
  const lines = content.split("\n");
  let hit = false;
  const out = lines.map(line => {
    if (!line.includes(marker) || !line.includes(matchKey)) return line;
    hit = true;
    return line.replace(/price:\s*[\d.]+/, `price: ${newPrice.toFixed(1)}`);
  }).join("\n");
  return { out, hit };
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log("=== F1 Fantasy price sync ===");
console.log("Dohvaćam vozače...");
const driversRaw = extractList(await tryFetch(DRIVER_ENDPOINTS));
console.log("Dohvaćam konstruktore...");
const teamsRaw = extractList(await tryFetch(TEAM_ENDPOINTS));

if (!driversRaw?.length) { console.error("FAIL: nijedan driver endpoint nije vratio podatke. Cijene NISU mijenjane."); process.exit(1); }

// Mapiranje vozača
const driverPrices = {};  // shortName → price
for (const p of driversRaw) {
  const name = String(extractName(p)).toLowerCase();
  const price = extractPrice(p);
  if (!price) continue;
  for (const [lastname, code] of Object.entries(LASTNAME_TO_CODE)) {
    if (name.includes(lastname)) { driverPrices[code] = price; break; }
  }
}
console.log(`Mapirano vozača: ${Object.keys(driverPrices).length}`, driverPrices);

// Mapiranje konstruktora (mogu biti u istom feedu kao vozači — position/type polje — ili zasebnom)
const teamPrices = {};    // id → price
const teamSource = teamsRaw?.length ? teamsRaw : driversRaw;
for (const t of teamSource) {
  const name = String(extractName(t)).toLowerCase();
  const price = extractPrice(t);
  if (!price) continue;
  const isConstructor = t?.is_constructor === true ||
    String(t?.position ?? t?.type ?? "").toLowerCase().includes("constructor") ||
    (teamsRaw?.length && teamSource === teamsRaw);
  if (!isConstructor) continue;
  for (const [re, id] of TEAMNAME_TO_ID) {
    if (re.test(name)) { teamPrices[id] = price; break; }
  }
}
console.log(`Mapirano konstruktora: ${Object.keys(teamPrices).length}`, teamPrices);

// ── Sanity guard: bolje ništa nego krivo ─────────────────────────────────────
// Očekivani popis se izvodi iz samog constants.ts (single source of truth za rostere),
// a vozači iz UNAVAILABLE_DRIVERS (route.ts) smiju nedostajati u API-ju.
const constantsSrc = readFileSync(CONSTANTS_PATH, "utf-8").split("\n");
const expectedDrivers = constantsSrc.filter(l => l.includes("driverNumber"))
  .map(l => l.match(/shortName:\s*"([A-Z]+)"/)?.[1]).filter(Boolean);
const expectedTeams = constantsSrc.filter(l => l.includes("drivers: ["))
  .map(l => l.match(/id:\s*"([a-z]+)"/)?.[1]).filter(Boolean);

let unavailable = [];
try {
  const routeSrc = readFileSync("app/api/predict/route.ts", "utf-8");
  const m = routeSrc.match(/UNAVAILABLE_DRIVERS\s*=\s*new Set<string>\(\[([^\]]*)\]\)/);
  unavailable = m ? [...m[1].matchAll(/"([A-Z]+)"/g)].map(x => x[1]) : [];
} catch {}

const missingDrivers = expectedDrivers.filter(c => !(c in driverPrices) && !unavailable.includes(c));
const missingTeams   = expectedTeams.filter(id => !(id in teamPrices));
const allPrices = [...Object.values(driverPrices), ...Object.values(teamPrices)];
const outOfRange = allPrices.filter(p => p < 1 || p > 45);

console.log(`Očekivano: ${expectedDrivers.length} vozača (dopušteno nedostaje: ${unavailable.join(",") || "—"}), ${expectedTeams.length} konstruktora`);

const errors = [];
if (missingDrivers.length) errors.push(`vozači bez cijene iz API-ja: ${missingDrivers.join(", ")}`);
if (missingTeams.length)   errors.push(`konstruktori bez cijene iz API-ja: ${missingTeams.join(", ")}`);
if (outOfRange.length)     errors.push(`cijene izvan raspona 1-45: ${outOfRange.join(", ")}`);
if (errors.length) {
  console.error(`FAIL — cijene NISU mijenjane:\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}

// Upozorenje (ne fail): API ima vozača kojeg nemamo u rosteru → vjerojatno nova supstitucija
const unknown = driversRaw
  .filter(p => extractPrice(p))
  .map(p => String(extractName(p)))
  .filter(n => !Object.keys(LASTNAME_TO_CODE).some(ln => n.toLowerCase().includes(ln)));
if (unknown.length) console.log(`::warning::API sadrži vozače kojih nema u rosteru (nova supstitucija?): ${unknown.join(", ")}`);

// ── Upis u constants.ts ──────────────────────────────────────────────────────
let content = readFileSync(CONSTANTS_PATH, "utf-8");
const before = content;
let changed = 0, missed = [];

for (const [code, price] of Object.entries(driverPrices)) {
  const { out, hit } = updateLine(content, "driverNumber", `shortName: "${code}"`, price);
  if (hit) { if (out !== content) changed++; content = out; } else missed.push(code);
}
for (const [id, price] of Object.entries(teamPrices)) {
  const { out, hit } = updateLine(content, "drivers: [", `id: "${id}"`, price);
  if (hit) { if (out !== content) changed++; content = out; } else missed.push(id);
}

if (missed.length) console.warn(`Nisu pronađeni u constants.ts (preskočeno): ${missed.join(", ")}`);

const dateStr = new Date().toLocaleDateString("hr-HR", { day:"2-digit", month:"2-digit", year:"numeric" });
content = content.replace(/\/\/ Zadnje ažuriranje:[^\n]*/, `// Zadnje ažuriranje: ${dateStr} (auto-sync)`);

if (content === before) { console.log("Nema promjena cijena — ništa za commitati."); process.exit(0); }

writeFileSync(CONSTANTS_PATH, content);
console.log(`✓ Ažurirano ${changed} cijena u ${CONSTANTS_PATH}`);
