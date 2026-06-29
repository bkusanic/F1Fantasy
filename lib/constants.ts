import type { Driver, Constructor, Track } from "./types";

// ─── 2026 Driver Roster ───────────────────────────────────────────────────────
// ⚠️  CIJENE SE MIJENJAJU SVAKI TJEDAN — ažuriraj iz F1 Fantasy app prije svake utrke!
// Zadnje ažuriranje: 29. 06. 2026. (admin)

export const DRIVERS_2025: Driver[] = [
  // McLaren
  { id: "nor", name: "Lando Norris",      shortName: "NOR", team: "mclaren",   price: 25.6, driverNumber: 1  },
  { id: "pia", name: "Oscar Piastri",     shortName: "PIA", team: "mclaren",   price: 24.9, driverNumber: 81 },
  // Mercedes
  { id: "rus", name: "George Russell",    shortName: "RUS", team: "mercedes",  price: 27.8, driverNumber: 63 },
  { id: "ant", name: "Kimi Antonelli",    shortName: "ANT", team: "mercedes",  price: 25.4, driverNumber: 12 },
  // Ferrari
  { id: "lec", name: "Charles Leclerc",   shortName: "LEC", team: "ferrari",   price: 23.2, driverNumber: 16 },
  { id: "ham", name: "Lewis Hamilton",    shortName: "HAM", team: "ferrari",   price: 24.5, driverNumber: 44 }, // ↑ was 22.0
  // Red Bull
  { id: "ver", name: "Max Verstappen",    shortName: "VER", team: "redbull",   price: 27.9, driverNumber: 33 },
  { id: "had", name: "Isack Hadjar",      shortName: "HAD", team: "redbull",   price: 12.7, driverNumber: 6  },
  // Williams
  { id: "alb", name: "Alex Albon",        shortName: "ALB", team: "williams",  price: 7.6, driverNumber: 23 },
  { id: "sai", name: "Carlos Sainz",      shortName: "SAI", team: "williams",  price: 11.4, driverNumber: 55 },
  // Racing Bulls
  { id: "law", name: "Liam Lawson",       shortName: "LAW", team: "rb",        price: 8.9,  driverNumber: 30 },
  { id: "lin", name: "Arvid Lindblad",    shortName: "LIN", team: "rb",        price: 6.2,  driverNumber: 41 }, // ↓ was 7.0
  // Aston Martin
  { id: "alo", name: "Fernando Alonso",   shortName: "ALO", team: "aston",     price: 5.6,  driverNumber: 14 },
  { id: "str", name: "Lance Stroll",      shortName: "STR", team: "aston",     price: 3.6,  driverNumber: 18 }, // ↓ was 7.5
  // Haas
  { id: "oco", name: "Esteban Ocon",      shortName: "OCO", team: "haas",      price: 10.1, driverNumber: 31 }, // ↑ was 8.0
  { id: "bea", name: "Oliver Bearman",    shortName: "BEA", team: "haas",      price: 7.0,  driverNumber: 87 },
  // Audi (ex-Sauber)
  { id: "hul", name: "Nico Hülkenberg",   shortName: "HUL", team: "audi",      price: 3.0,  driverNumber: 27 },
  { id: "bor", name: "Gabriel Bortoleto", shortName: "BOR", team: "audi",      price: 6.0,  driverNumber: 5  },
  // Alpine
  { id: "gas", name: "Pierre Gasly",      shortName: "GAS", team: "alpine",    price: 12.8,  driverNumber: 10 },
  { id: "col", name: "Franco Colapinto",  shortName: "COL", team: "alpine",    price: 9.8,  driverNumber: 43 }, // ↑ was 7.0
  // Cadillac (new team)
  { id: "per", name: "Sergio Pérez",      shortName: "PER", team: "cadillac",  price: 5.6,  driverNumber: 11 },
  { id: "bot", name: "Valtteri Bottas",   shortName: "BOT", team: "cadillac",  price: 3.0,  driverNumber: 77 },
];

// ─── 2026 Constructors ────────────────────────────────────────────────────────
// ⚠️  Ažuriraj cijene tjedni iz F1 Fantasy app!

export const CONSTRUCTORS_2025: Constructor[] = [
  { id: "mclaren",  name: "McLaren",       shortName: "MCL", price: 30.1, drivers: ["nor", "pia"] },
  { id: "mercedes", name: "Mercedes",      shortName: "MER", price: 31.7, drivers: ["rus", "ant"] },
  { id: "ferrari",  name: "Ferrari",       shortName: "FER", price: 25.7, drivers: ["lec", "ham"] },
  { id: "redbull",  name: "Red Bull",      shortName: "RBR", price: 30.0, drivers: ["ver", "had"] }, // ↑ was 22.0
  { id: "williams", name: "Williams",      shortName: "WIL", price: 14.4, drivers: ["alb", "sai"] },
  { id: "rb",       name: "Racing Bulls",  shortName: "RB",  price: 11.1,  drivers: ["law", "lin"] },
  { id: "aston",    name: "Aston Martin",  shortName: "AMR", price: 6.3,  drivers: ["alo", "str"] },
  { id: "haas",     name: "Haas",          shortName: "HAA", price: 10.2,  drivers: ["oco", "bea"] },
  { id: "audi",     name: "Audi",          shortName: "AUD", price: 5.0,  drivers: ["hul", "bor"] },
  { id: "alpine",   name: "Alpine",        shortName: "ALP", price: 17.3,  drivers: ["gas", "col"] },
  { id: "cadillac", name: "Cadillac",      shortName: "CAD", price: 4.8,  drivers: ["per", "bot"] },
];

// ─── 2026 Race Calendar (22 races — Bahrain & Saudi otkazani) ─────────────────

export const TRACKS_2025: Track[] = [
  { id: "aus", name: "Australian GP",        country: "Australia",   circuitType: "street",    isSprint: false, round: 1,  date: "2026-03-08" },
  { id: "chn", name: "Chinese GP",           country: "China",       circuitType: "permanent", isSprint: true,  round: 2,  date: "2026-03-15" },
  { id: "jpn", name: "Japanese GP",          country: "Japan",       circuitType: "permanent", isSprint: false, round: 3,  date: "2026-03-29" },
  { id: "mia", name: "Miami GP",             country: "USA",         circuitType: "permanent", isSprint: true,  round: 4,  date: "2026-05-03" },
  { id: "can", name: "Canadian GP",          country: "Canada",      circuitType: "permanent", isSprint: true,  round: 5,  date: "2026-05-24" },
  { id: "mon", name: "Monaco GP",            country: "Monaco",      circuitType: "street",    isSprint: false, round: 6,  date: "2026-06-07" },
  { id: "esp", name: "Barcelona-Catalunya GP", country: "Spain",     circuitType: "permanent", isSprint: false, round: 7,  date: "2026-06-14" },
  { id: "aut", name: "Austrian GP",          country: "Austria",     circuitType: "permanent", isSprint: false, round: 8,  date: "2026-06-28" },
  { id: "gbr", name: "British GP",           country: "UK",          circuitType: "permanent", isSprint: true,  round: 9,  date: "2026-07-05" },
  { id: "bel", name: "Belgian GP",           country: "Belgium",     circuitType: "permanent", isSprint: false, round: 10, date: "2026-07-19" },
  { id: "hun", name: "Hungarian GP",         country: "Hungary",     circuitType: "permanent", isSprint: false, round: 11, date: "2026-07-26" },
  { id: "nld", name: "Dutch GP",             country: "Netherlands", circuitType: "permanent", isSprint: true,  round: 12, date: "2026-08-23" },
  { id: "ita", name: "Italian GP",           country: "Italy",       circuitType: "permanent", isSprint: false, round: 13, date: "2026-09-06" },
  { id: "mad", name: "Madrid GP",            country: "Spain",       circuitType: "street",    isSprint: false, round: 14, date: "2026-09-13" },
  { id: "aze", name: "Azerbaijan GP",        country: "Azerbaijan",  circuitType: "street",    isSprint: false, round: 15, date: "2026-09-27" },
  { id: "sgp", name: "Singapore GP",         country: "Singapore",   circuitType: "street",    isSprint: true,  round: 16, date: "2026-10-11" },
  { id: "usc", name: "United States GP",     country: "USA",         circuitType: "permanent", isSprint: false, round: 17, date: "2026-10-25" },
  { id: "bra", name: "São Paulo GP",         country: "Brazil",      circuitType: "permanent", isSprint: false, round: 18, date: "2026-11-08" },
  { id: "lvg", name: "Las Vegas GP",         country: "USA",         circuitType: "street",    isSprint: false, round: 19, date: "2026-11-21" },
  { id: "mex", name: "Mexico City GP",       country: "Mexico",      circuitType: "permanent", isSprint: false, round: 20, date: "2026-11-28" },
  { id: "qat", name: "Qatar GP",             country: "Qatar",       circuitType: "permanent", isSprint: false, round: 21, date: "2026-12-05" },
  { id: "abu", name: "Abu Dhabi GP",         country: "UAE",         circuitType: "permanent", isSprint: false, round: 22, date: "2026-12-06" },
];

// ─── Chip Definitions ─────────────────────────────────────────────────────────

export const CHIPS = [
  { id: "wildcard",    label: "Wildcard",    icon: "🃏", desc: "Unlimited transfera · ostaje u $100M cap" },
  { id: "limitless",   label: "Limitless",   icon: "♾️", desc: "Nema budget cap za 1 vikend" },
  { id: "no_negative", label: "No Negative", icon: "🛡️", desc: "Negativni bodovi = 0" },
  { id: "extra_drs",   label: "Extra DRS",   icon: "🚀", desc: "Jedan vozač trojno boduje (3×)" },
  { id: "autopilot",   label: "AutoPilot",   icon: "🤖", desc: "Auto DRS Boost na highest scorer" },
  { id: "final_fix",   label: "Final Fix",   icon: "🔧", desc: "Unlimited transfera nakon qualifyinga" },
] as const;

// ─── Team Colors (2026) ───────────────────────────────────────────────────────

export const TEAM_COLORS: Record<string, string> = {
  mclaren:  "#FF8000",
  mercedes: "#00D2BE",
  ferrari:  "#E8002D",
  redbull:  "#3671C6",
  williams: "#00A3E0",
  rb:       "#6692FF",
  aston:    "#229971",
  haas:     "#B6BABD",
  audi:     "#C0C0C0",
  alpine:   "#FF87BC",
  cadillac: "#004B87",
};

// ─── Default Team ─────────────────────────────────────────────────────────────

export const DEFAULT_TEAM = {
  drivers: [] as string[],
  constructors: [] as string[],
  captain: "",
  budget: 100,
  usedChips: [] as string[],
};
