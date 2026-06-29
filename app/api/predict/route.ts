import { NextRequest, NextResponse } from "next/server";

// Vercel: allow up to 60s (Pro) / 15s (Hobby).
// Without this, Hobby plan cuts off at 10s which isn't enough.
export const maxDuration = 60;
export const runtime = "nodejs";

// ─── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchT(url: string, options: RequestInit & {next?: any} = {}, timeoutMs = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}


/** How easy it is to overtake on this circuit (0=Monaco, 1=Monza) */
const TRACK_OVERTAKING: Record<string, number> = {
  mon: 0.05, sgp: 0.15, hun: 0.20, mad: 0.25,
  aus: 0.35, esp: 0.40, gbr: 0.45, nld: 0.40, aut: 0.50,
  jpn: 0.45, bhr: 0.55, abu: 0.50, bel: 0.55,
  can: 0.80, ita: 0.82, aze: 0.70, lvg: 0.68,
  bra: 0.72, usc: 0.65, mex: 0.60, chn: 0.55, qat: 0.55, mia: 0.50,
};
/** Extra incident/DNF risk modifier per track */
const TRACK_INCIDENT_RISK: Record<string, number> = {
  mon: 0.35, aze: 0.25, sgp: 0.20, aus: 0.15, lvg: 0.12,
  bra: 0.10, gbr: 0.08, can: 0.08, bel: 0.05,
};

// ─── Jolpica circuit IDs ──────────────────────────────────────────────────────
const CIRCUIT_IDS: Record<string, string> = {
  aus:"albert_park", chn:"shanghai", jpn:"suzuka", mia:"miami", can:"villeneuve",
  mon:"monaco", esp:"catalunya", aut:"red_bull_ring", gbr:"silverstone", bel:"spa",
  hun:"hungaroring", nld:"zandvoort", ita:"monza", mad:"madrid", aze:"baku",
  sgp:"marina_bay", usc:"americas", bra:"interlagos", lvg:"las_vegas",
  mex:"rodriguez", qat:"losail", abu:"yas_marina",
};

// ─── OpenF1 circuit names ─────────────────────────────────────────────────────
const OPENF1_CIRCUIT: Record<string, string[]> = {
  // Primary name first, then alternatives — tried in order until one works
  aus: ["Albert Park", "Melbourne"],
  chn: ["Shanghai", "Shanghai International Circuit"],
  jpn: ["Suzuka", "Suzuka Circuit"],
  mia: ["Miami", "Miami International Autodrome"],
  can: ["Circuit Gilles Villeneuve", "Villeneuve", "Montreal"],
  mon: ["Monaco", "Circuit de Monaco"],
  esp: ["Catalunya", "Circuit de Barcelona-Catalunya", "Barcelona"],
  aut: ["Red Bull Ring", "Spielberg"],
  gbr: ["Silverstone", "Silverstone Circuit"],
  bel: ["Spa-Francorchamps", "Spa"],
  hun: ["Hungaroring", "Budapest"],
  nld: ["Zandvoort", "Circuit Zandvoort"],
  ita: ["Monza", "Autodromo Nazionale Monza"],
  mad: ["Madrid", "Circuit Madrid"],
  aze: ["Baku", "Baku City Circuit"],
  sgp: ["Marina Bay", "Marina Bay Street Circuit"],
  usc: ["Circuit of The Americas", "COTA", "Austin"],
  bra: ["Interlagos", "Autódromo José Carlos Pace", "São Paulo"],
  lvg: ["Las Vegas", "Las Vegas Strip Circuit"],
  mex: ["Rodríguez", "Rodriguez", "Autodromo Hermanos Rodriguez", "Mexico City"],
  qat: ["Lusail", "Lusail International Circuit"],
  abu: ["Yas Marina", "Yas Marina Circuit"],
};

// ─── Driver & team baselines (2026 calibrated) ────────────────────────────────
const DRIVER_BASELINE: Record<string, number> = {
  ANT:32, RUS:28, NOR:26, PIA:23, LEC:22, VER:20, HAM:19, SAI:15,
  ALB:13, HAD:12, LAW:11, BEA:11, ALO:9, OCO:9, GAS:8, HUL:8,
  BOR:7, STR:7, COL:6, LIN:6, PER:4, BOT:4,
};
const TEAM_FACTOR: Record<string, number> = {
  mercedes:1.0, mclaren:1.0, ferrari:0.98, redbull:0.95, williams:0.92,
  rb:0.88, aston:0.85, haas:0.85, audi:0.82, alpine:0.80, cadillac:0.65,
};

// ─── F1 Fantasy scoring ───────────────────────────────────────────────────────
function calcFP(pos: number|null, grid: number, fl: boolean, sprint = false): number {
  if (pos === null) return sprint ? -10 : -20;
  const GP: Record<number,number> = {1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1};
  const SP: Record<number,number> = {1:8,2:7,3:6,4:5,5:4,6:3,7:2,8:1};
  let pts = sprint ? (SP[pos]??0) : (GP[pos]??0);
  if (fl && !sprint && pos<=10) pts += 5;
  if (fl && sprint) pts += 3;
  pts += (grid-pos)>0 ? (grid-pos)*2 : (grid-pos);
  return pts;
}

// ─── Jolpica: season form ─────────────────────────────────────────────────────
interface DForm { avgPts: number; dnfRate: number; races: number }

async function getForm(season: number): Promise<Record<string, DForm>> {
  const s: Record<string,{total:number,races:number,dnfs:number}> = {};
  try {
    const r = await fetchT(`https://api.jolpi.ca/ergast/f1/${season}/results.json?limit=100&offset=0`,
      { next: { revalidate: 3600 } }, 8000);
    if (!r.ok) return {};
    const data = (await r.json())?.MRData;
    for (const race of data?.RaceTable?.Races ?? []) {
      for (const res of race.Results ?? []) {
        const code = res.Driver?.code;
        if (!code) continue;
        const pos = (res.status==="Finished"||res.status?.startsWith("+")) ? parseInt(res.position) : null;
        const fp = calcFP(pos, parseInt(res.grid)||1, res.FastestLap?.rank==="1");
        if (!s[code]) s[code]={total:0,races:0,dnfs:0};
        s[code].total+=fp; s[code].races++;
        if (pos===null) s[code].dnfs++;
      }
    }
  } catch {}
  return Object.fromEntries(Object.entries(s).map(([c,v])=>[c,{
    races:v.races,
    avgPts: v.races>0 ? parseFloat((v.total/v.races).toFixed(1)) : 0,
    dnfRate: parseFloat((v.dnfs/Math.max(v.races,1)).toFixed(2)),
  }]));
}

// ─── Jolpica: track history ───────────────────────────────────────────────────
interface THistory { avgPts: number; dnfRate: number }

async function getTrackHistory(circuitId: string): Promise<{stats:Record<string,THistory>,avgDnfRate:number}> {
  const s: Record<string,{total:number,races:number,dnfs:number}> = {};
  let td=0, te=0;

  // Fetch all 3 seasons IN PARALLEL (was sequential — up to 18s, now ~6s max)
  const results = await Promise.all([2023,2024,2025].map(async year => {
    try {
      const r = await fetchT(
        `https://api.jolpi.ca/ergast/f1/${year}/circuits/${circuitId}/results.json?limit=50`,
        { next: { revalidate: 86400 } }, 5000);
      if (!r.ok) return null;
      return (await r.json())?.MRData?.RaceTable?.Races?.[0] ?? null;
    } catch { return null; }
  }));

  for (const race of results) {
    if (!race) continue;
    for (const res of race.Results??[]) {
      const code = res.Driver?.code;
      if (!code) continue;
      const pos = (res.status==="Finished"||res.status?.startsWith("+")) ? parseInt(res.position) : null;
      const fp = calcFP(pos, parseInt(res.grid)||1, res.FastestLap?.rank==="1");
      if (!s[code]) s[code]={total:0,races:0,dnfs:0};
      s[code].total+=fp; s[code].races++;
      if (pos===null){s[code].dnfs++;td++;}
      te++;
    }
  }
  return {
    stats: Object.fromEntries(Object.entries(s).map(([c,v])=>[c,{
      avgPts:parseFloat((v.total/Math.max(v.races,1)).toFixed(1)),
      dnfRate:parseFloat((v.dnfs/Math.max(v.races,1)).toFixed(2)),
    }])),
    avgDnfRate: te>0 ? parseFloat((td/te).toFixed(2)) : 0.08,
  };
}

// ─── OpenF1: practice / qualifying for current weekend ────────────────────────
interface WeekendData {
  // Separate signals per spec §3 Korak 1
  qualiSimScores:  Record<string, number>;  // 0-1, based on fastest lap (short run)
  longRunScores:   Record<string, number>;  // 0-1, based on consistent long stints
  gridPositions:   Record<string, number>;  // if qualifying already done
  sessionsCompleted: number;                // 0-3 practice sessions seen
  sessionNames:    string[];
  noiseLevel:      "low"|"medium"|"high";  // how reliable is practice data
  available:       boolean;
}

async function getWeekendData(trackId: string, year: number): Promise<WeekendData> {
  const empty: WeekendData = {
    qualiSimScores:{}, longRunScores:{}, gridPositions:{},
    sessionsCompleted:0, sessionNames:[], noiseLevel:"high", available:false,
  };
  try {
    const circuitNames = OPENF1_CIRCUIT[trackId] ?? [];
    if (!circuitNames.length) return empty;

    // Try each name variant until one returns sessions
    let allSessions: any[] = [];
    for (const cName of circuitNames) {
      try {
        const sessRes = await fetchT(
          `https://api.openf1.org/v1/sessions?year=${year}&circuit_short_name=${encodeURIComponent(cName)}`,
          { next: { revalidate: 300 } }, 4000);
        if (!sessRes.ok) continue;
        const data: any[] = await sessRes.json();
        if (Array.isArray(data) && data.length > 0) { allSessions = data; break; }
      } catch { continue; }
    }

    const now = new Date();
    const completed = allSessions.filter(s => new Date(s.date_end ?? s.date_start) <= now);
    const practiceCompleted = completed.filter(s =>
      s.session_name?.startsWith("Practice") || s.session_name?.startsWith("Sprint Practice"));
    const qualiCompleted = completed.filter(s =>
      s.session_name?.includes("Qualifying"));

    // ── If qualifying done: use grid positions (most accurate) ────────────────
    // But per spec: decision is usually BEFORE qualifying. Still handle this case.
    const latestQuali = qualiCompleted.sort((a,b) =>
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime())[0];

    let gridPositions: Record<string,number> = {};
    if (latestQuali) {
      const [posRes, drRes] = await Promise.all([
        fetchT(`https://api.openf1.org/v1/position?session_key=${latestQuali.session_key}`, { next:{revalidate:300} }, 5000),
        fetchT(`https://api.openf1.org/v1/drivers?session_key=${latestQuali.session_key}`, { next:{revalidate:300} }, 5000),
      ]);
      if (posRes.ok && drRes.ok) {
        const positions: any[] = await posRes.json();
        const drs: any[] = await drRes.json();
        const num2code: Record<number,string> = {};
        for (const d of drs) if (d.name_acronym) num2code[d.driver_number] = d.name_acronym;
        const finalPos: Record<number,number> = {};
        for (const p of positions) if (p.position) finalPos[p.driver_number] = p.position;
        for (const [num, pos] of Object.entries(finalPos)) {
          const code = num2code[parseInt(num)];
          if (code) gridPositions[code] = pos;
        }
      }
    }

    // ── Practice sessions: extract quali-sim and long-run pace ────────────────
    const qualiSimScores: Record<string,number> = {};
    const longRunScores:  Record<string,number> = {};

    // Use /position endpoint for practice (much smaller than /laps which has thousands of rows)
    // Process max 2 most recent practice sessions to stay within timeout
    const recentPractice = practiceCompleted
      .sort((a,b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
      .slice(0, 2);

    for (const sess of recentPractice) {
      try {
        const [posRes, drRes] = await Promise.all([
          fetchT(`https://api.openf1.org/v1/position?session_key=${sess.session_key}`, { next:{revalidate:300} }, 4000),
          fetchT(`https://api.openf1.org/v1/drivers?session_key=${sess.session_key}`, { next:{revalidate:300} }, 3000),
        ]);
        if (!posRes.ok || !drRes.ok) continue;

        const positions: any[] = await posRes.json();
        const drs: any[] = await drRes.json();

        const num2code: Record<number,string> = {};
        for (const d of drs) if (d.name_acronym) num2code[d.driver_number] = d.name_acronym;

        // Final position per driver (last entry wins)
        const finalPos: Record<number,number> = {};
        for (const p of positions) if (p.position) finalPos[p.driver_number] = p.position;

        const n = Object.keys(finalPos).length || 20;
        for (const [num, pos] of Object.entries(finalPos)) {
          const code = num2code[parseInt(num)];
          if (!code) continue;
          // Score: P1 = 1.0, P20 = 0.0
          const score = parseFloat(((n - pos) / Math.max(n - 1, 1)).toFixed(3));
          // Both quali-sim and long-run use the same position signal from practice
          // (we can't distinguish without lap data, but position is still informative)
          qualiSimScores[code] = qualiSimScores[code] !== undefined
            ? (qualiSimScores[code] + score) / 2 : score;
          longRunScores[code] = qualiSimScores[code]; // use same signal
        }
      } catch { continue; }
    }

    const sessionsCompleted = practiceCompleted.length;
    const noiseLevel: WeekendData["noiseLevel"] =
      sessionsCompleted >= 3 ? "low" :
      sessionsCompleted >= 2 ? "medium" : "high";

    return {
      qualiSimScores, longRunScores, gridPositions,
      sessionsCompleted,
      sessionNames: completed.map(s => s.session_name),
      noiseLevel,
      available: sessionsCompleted > 0 || Object.keys(gridPositions).length > 0,
    };
  } catch { return empty; }
}

// ─── EV calculation per spec §3 Korak 1 ─────────────────────────────────────
/**
 * Projected EV following the spec pipeline:
 *   EV = quali_component + race_component + overtake_upside − risk_penalty ± confidence_adj
 *
 * Since decision is before qualifying, "positions" are estimated from practice.
 */
function calcEV(
  code: string,
  team: string,
  form: Record<string, DForm>,
  trackHist: Record<string, THistory>,
  weekend: WeekendData,
  trackId: string,
  isSprint: boolean
): { ev: number; confidence: "HIGH"|"MEDIUM"|"LOW"; components: Record<string,number> } {

  const baseline = (DRIVER_BASELINE[code] ?? 8) * (TEAM_FACTOR[team] ?? 0.85);
  const f = form[code]?.avgPts;
  const t = trackHist[code]?.avgPts;
  const dnfRate2026 = form[code]?.dnfRate ?? 0.08;
  const trackIncident = TRACK_INCIDENT_RISK[trackId] ?? 0.05;
  const overtakingFactor = TRACK_OVERTAKING[trackId] ?? 0.45;

  // ── Confidence: how much do we trust practice data? (spec §3 Korak 1, §5) ──
  const { noiseLevel, sessionsCompleted } = weekend;
  const practiceWeight =
    noiseLevel === "low" ? 0.30 :
    noiseLevel === "medium" ? 0.20 : 0.10;  // high noise → trust practice less
  const historyWeight = 1 - practiceWeight;

  // ── Base EV from form + track history (always available) ─────────────────
  let baseEV: number;
  if (f !== undefined && t !== undefined) {
    const fAdj = f < 0 ? f * (1 - dnfRate2026 * 0.6) + baseline * (dnfRate2026 * 0.6) : f;
    baseEV = fAdj * 0.55 + t * 0.35 + baseline * 0.10;
  } else if (f !== undefined) {
    const fAdj = f < 0 ? f * (1 - dnfRate2026 * 0.6) + baseline * (dnfRate2026 * 0.6) : f;
    baseEV = fAdj * 0.80 + baseline * 0.20;
  } else if (t !== undefined) {
    baseEV = t * 0.70 + baseline * 0.30;
  } else {
    baseEV = baseline;
  }

  // ── Quali component: quali-sim pace predicts qualifying position ──────────
  // Qualifying adds up to +10 pts (P1) down to +1 (P10); estimate from pace
  let qualiComponent = 0;
  const qScore = weekend.gridPositions[code]
    ? (1 - (weekend.gridPositions[code] - 1) / 19) // use real grid if known
    : weekend.qualiSimScores[code];

  if (qScore !== undefined) {
    // Estimated grid position from pace score (1.0 = P1 estimate, 0.0 = P20)
    const estimatedGrid = Math.round(1 + (1 - qScore) * 19);
    qualiComponent = Math.max(0, 11 - estimatedGrid); // P1=10, P10=1, P11+=0
  }

  // ── Race component: long-run pace predicts race position ──────────────────
  let raceComponent = 0;
  const lScore = weekend.longRunScores[code];
  if (lScore !== undefined) {
    // Long run score influences expected race position
    // 1.0 = P1-3 likely, 0.0 = P15+ likely
    raceComponent = lScore * 8; // max +8 pts bonus for best long-run pace
  }

  // ── Overtake upside: bonus if good long run but suspected low grid ────────
  // Drivers who qualify poorly but have great race pace on high-OT tracks gain pts via overtakes
  let overtakeUpside = 0;
  if (lScore !== undefined && qScore !== undefined) {
    const gridVsRacePaceDelta = lScore - qScore; // positive = better race than quali
    if (gridVsRacePaceDelta > 0.1 && overtakingFactor > 0.5) {
      overtakeUpside = gridVsRacePaceDelta * overtakingFactor * 6;
    }
  }

  // ── Risk penalty (spec: risk is equal to points) ─────────────────────────
  const effectiveDNFRate = dnfRate2026 * (1 + trackIncident);
  const riskPenalty = effectiveDNFRate * (isSprint ? 10 : 20) * 0.6; // expected loss

  // ── Confidence adjustment (spec §3 Korak 1) ──────────────────────────────
  // When practice is noisy, shift weight toward form + track history
  // When only FP1 available, reduce overall EV confidence
  const hasPracticeSignal = qScore !== undefined || lScore !== undefined;
  const confidenceAdj = hasPracticeSignal
    ? (noiseLevel === "high" ? -1.0 : 0) // penalise single-session noise
    : 0;

  // ── Combine ───────────────────────────────────────────────────────────────
  const practiceBonus = hasPracticeSignal
    ? (qualiComponent * 0.5 + raceComponent * 0.5 + overtakeUpside) * practiceWeight
    : 0;

  const ev = baseEV * historyWeight
    + practiceBonus
    - riskPenalty
    + confidenceAdj;

  const floor = baseline * 0.30;
  const finalEV = parseFloat(Math.max(floor, ev).toFixed(2));

  // Confidence level for display
  const confidence: "HIGH"|"MEDIUM"|"LOW" =
    Object.keys(weekend.gridPositions).length > 0 ? "HIGH" :
    sessionsCompleted >= 2 ? "MEDIUM" : "LOW";

  return {
    ev: finalEV,
    confidence,
    components: {
      baseEV: parseFloat(baseEV.toFixed(1)),
      qualiComponent: parseFloat(qualiComponent.toFixed(1)),
      raceComponent: parseFloat(raceComponent.toFixed(1)),
      overtakeUpside: parseFloat(overtakeUpside.toFixed(1)),
      riskPenalty: parseFloat(riskPenalty.toFixed(1)),
      practiceWeight,
    },
  };
}

// ─── Fresh team optimizer ─────────────────────────────────────────────────────
// ─── Fresh team optimizer — per spec §3 ──────────────────────────────────────
/**
 * Exhaustive combinatorial search (spec §3 Korak 2 & §7):
 *
 *   team_EV = Σ EV(svih 7 asseta) + EV(boost_vozač)   ← boost vozač se broji duplo
 *
 * Primary:   maximise team_EV
 * Tie-break: minimise remaining budget  (spec §4 — potrošnja je sekundarni cilj)
 *
 * Filters applied BEFORE search:
 *   - Avoid list: dnfRate > 0.30 AND avgPts < 0  (loša forma + visok DNF rizik)
 *   - DNF cap: at most 1 high-risk driver per team  (spec §3 Korak 5)
 *
 * ~1.4M iterations, < 100ms in Node.js — exhaustive, not greedy.
 */
interface FreshResult {
  drivers: string[];
  constructors: string[];
  boostDriver: string;
  totalCost: number;
  remainingBudget: number;
  totalEV: number;       // includes boost bonus
  baseEV: number;        // without boost (sum of 7)
  avoidList: {code:string; price:number; ev:number; reason:string}[];
  archetype: "stars_and_scrubs" | "balanced";
  considered: number;
}

const CONSTRUCTOR_TIER: Record<string,number> = {
  mercedes:1, mclaren:1, ferrari:1,   // Tier A
  redbull:2, williams:2,              // Tier B
  rb:3, aston:3, haas:3, audi:3, alpine:3, cadillac:3,  // Tier C
};

const HIGH_DNF_THRESHOLD = 0.25;  // >25% DNF rate = high risk
const AVOID_DNF_THRESHOLD = 0.30; // >30% + negative pts = on avoid list

function freshOptimize(
  allDrivers: {code:string; price:number; ev:number; dnfRate:number; avgPts:number}[],
  allConstrs: {id:string; price:number; ev:number}[],
  budget: number
): FreshResult {

  // ── Build avoid list (informational only — NOT a hard filter) ───────────
  // Per spec: "osim ako su u optimalnom rješenju zbog visokog EV-a"
  // → avoid list is shown to the user, optimizer runs on ALL drivers
  const avoidList: FreshResult["avoidList"] = [];
  for (const d of allDrivers) {
    // Only flag truly unreliable drivers (>50% DNF AND deeply negative avg)
    if (d.dnfRate > 0.50 && d.avgPts < -8) {
      avoidList.push({ code:d.code, price:d.price, ev:d.ev,
        reason:`DNF rizik ${Math.round(d.dnfRate*100)}% + loša forma (avg ${d.avgPts.toFixed(1)}pts)` });
    }
  }

  // Optimizer runs on ALL drivers — avoid list is just shown to user
  const drivers = allDrivers;
  const constrs  = allConstrs;

  // Sort by EV/price ratio for pruning (doesn't affect correctness — only speed)
  const sd = [...drivers].sort((a,b) => (b.ev/b.price) - (a.ev/a.price));
  const sc = [...constrs].sort((a,b) => (b.ev/b.price) - (a.ev/a.price));
  const n=sd.length, m=sc.length;

  // Cheapest possible 2 constructors (for budget pruning)
  const minC2 = sc.slice(-2).reduce((s,c)=>s+c.price, 0);

  let bestTeamEV   = -Infinity;
  let bestRemaining = Infinity;   // tie-break: lower = better (spent more)
  let bestD: string[]  = [];
  let bestC: string[]  = [];
  let bestCost         = 0;
  let bestBoost        = "";
  let considered       = 0;

  for(let i=0;i<n-4;i++){
  for(let j=i+1;j<n-3;j++){
  for(let k=j+1;k<n-2;k++){
  for(let l=k+1;l<n-1;l++){
  for(let p=l+1;p<n;p++){
    const dc = sd[i].price+sd[j].price+sd[k].price+sd[l].price+sd[p].price;
    if(dc > budget - minC2) continue;

    // DNF cap: at most 1 high-risk driver (spec §3 Korak 5)
    const highDNF = [sd[i],sd[j],sd[k],sd[l],sd[p]]
      .filter(d => d.dnfRate > HIGH_DNF_THRESHOLD).length;
    if(highDNF > 1) continue;

    const driverEVs = [sd[i].ev, sd[j].ev, sd[k].ev, sd[l].ev, sd[p].ev];
    const sumDriverEV = driverEVs.reduce((s,e)=>s+e, 0);
    // Boost goes to driver with highest EV (spec §3 Korak 3)
    const boostEV = Math.max(...driverEVs);
    const boostIdx = driverEVs.indexOf(boostEV);
    const boostCode = [sd[i].code,sd[j].code,sd[k].code,sd[l].code,sd[p].code][boostIdx];

    for(let a=0;a<m-1;a++){
    for(let b=a+1;b<m;b++){
      const tc = dc + sc[a].price + sc[b].price;
      if(tc > budget) continue;
      considered++;

      const sumConstrEV = sc[a].ev + sc[b].ev;
      // team_EV includes boost bonus (spec §3 Korak 3):
      // boost driver counted twice = base sum + boostEV
      const teamEV = sumDriverEV + sumConstrEV + boostEV;
      const remaining = budget - tc;

      // Primary: max teamEV; tie-break: min remaining (spec §4)
      const betterEV   = teamEV > bestTeamEV + 0.05;
      const tieBreak   = Math.abs(teamEV - bestTeamEV) <= 0.05 && remaining < bestRemaining;

      if(betterEV || tieBreak){
        bestTeamEV  = teamEV;
        bestRemaining = remaining;
        bestD       = [sd[i].code,sd[j].code,sd[k].code,sd[l].code,sd[p].code];
        bestC       = [sc[a].id, sc[b].id];
        bestCost    = tc;
        bestBoost   = boostCode;
      }
    }}
  }}}}}

  // Detect archetype (spec §6)
  const tierAConstrs = bestC.filter(id => (CONSTRUCTOR_TIER[id]??3) === 1).length;
  const archetype: FreshResult["archetype"] =
    tierAConstrs >= 2 ? "stars_and_scrubs" : "balanced";

  // Fallback if no valid team found (should not happen with proper prices)
  // Per spec: maximise EV, tie-break on minimum remaining budget
  if (bestD.length < 5) {
    // Greedy fallback: sort all by EV desc, pick as many as fit in budget
    const sortedD = [...allDrivers].sort((a,b) => b.ev - a.ev);
    const sortedC = [...allConstrs].sort((a,b) => b.ev - a.ev);
    let rem = budget;
    const pickedD: typeof allDrivers = [];
    const pickedC: typeof allConstrs = [];
    // Pick top 2 constructors first
    for (const c of sortedC) {
      if (pickedC.length >= 2) break;
      if (rem - c.price >= 0) { pickedC.push(c); rem -= c.price; }
    }
    // Pick top 5 drivers from remaining budget
    for (const d of sortedD) {
      if (pickedD.length >= 5) break;
      if (rem - d.price >= 0) { pickedD.push(d); rem -= d.price; }
    }
    if (pickedD.length === 5 && pickedC.length === 2) {
      bestD = pickedD.map(d => d.code);
      bestC = pickedC.map(c => c.id);
      bestCost = budget - rem;
      const boostEV = Math.max(...pickedD.map(d => d.ev));
      bestTeamEV = pickedD.reduce((s,d)=>s+d.ev,0) + pickedC.reduce((s,c)=>s+c.ev,0) + boostEV;
      bestBoost = pickedD.find(d => d.ev === boostEV)?.code ?? pickedD[0].code;
      bestRemaining = rem;
    }
  }

  return {
    drivers: bestD,
    constructors: bestC,
    boostDriver: bestBoost,
    totalCost: parseFloat(bestCost.toFixed(1)),
    remainingBudget: parseFloat((budget - bestCost).toFixed(1)),
    totalEV: parseFloat(bestTeamEV.toFixed(1)),
    baseEV: parseFloat((bestTeamEV - (allDrivers.find(d=>d.code===bestBoost)?.ev??0)).toFixed(1)),
    avoidList,
    archetype,
    considered,
  };
}

// ─── Transfer optimizer following spec pipeline (steps 0-5) ──────────────────
interface TransferResult {
  transfers: any[];
  recommendedBoost: string;
  boostChanged: boolean;
  weakLinks: { code: string; type: "hard_out"|"sell_before_drop"; reason: string }[];
  noTransferScore: number;
  totalNetGain: number;
  considered: number;
  sessionsWarning: string | null;
}

function pipelineOptimize(
  currentDrivers: string[],
  currentConstructors: string[],
  currentBoost: string,
  allDriverData: Record<string,any>,
  constructorData: Record<string,any>,
  evMap: Record<string,{ev:number, confidence:"HIGH"|"MEDIUM"|"LOW"}>,
  remainingBudget: number,
  freeTransfers: number,
  weekend: WeekendData
): TransferResult {

  const noTransferScore = parseFloat(
    [...currentDrivers,...currentConstructors]
      .reduce((s,c)=>s+(evMap[c]?.ev??0), 0).toFixed(1));

  // ── Step 0: Classify levers ───────────────────────────────────────────────
  // Boost = free lever, handle independently
  // Transfers = budget+count constrained

  // ── Step 2: Boost allocation (always optimize, free) ─────────────────────
  const driverEVs = currentDrivers.map(id => ({
    id, ev: evMap[id]?.ev ?? 0, conf: evMap[id]?.confidence ?? "LOW"
  }));
  // Prefer HIGH confidence + high EV; slight floor preference (avoid pure ceiling picks)
  const boostScored = driverEVs.sort((a,b) => {
    const confBonus = (x: string) => x==="HIGH" ? 1.5 : x==="MEDIUM" ? 0.8 : 0;
    return (b.ev + confBonus(b.conf)) - (a.ev + confBonus(a.conf));
  });
  const recommendedBoost = boostScored[0]?.id ?? currentBoost;
  const boostChanged = recommendedBoost !== currentBoost;

  // ── Step 3: Identify weak links ───────────────────────────────────────────
  const weakLinks: TransferResult["weakLinks"] = [];
  for (const id of currentDrivers) {
    const ev = evMap[id]?.ev ?? 0;
    const qSim = weekend.qualiSimScores[id];
    const lRun = weekend.longRunScores[id];
    const dnfRate = 0.15; // approx for classification
    const price = allDriverData[id]?.price ?? 0;
    const baseline = (DRIVER_BASELINE[id] ?? 8) * (TEAM_FACTOR[allDriverData[id]?.team ?? ""] ?? 0.85);

    const poorPractice = (qSim !== undefined && qSim < 0.25) || (lRun !== undefined && lRun < 0.25);
    const highDNF = (evMap[id] as any)?.components?.riskPenalty > 3;
    const expensiveAndSlow = price > 12 && ev < baseline * 0.7;

    if (poorPractice && highDNF) {
      weakLinks.push({ code: id, type: "hard_out",
        reason: `Slab u treninzima (${qSim?.toFixed(2)??'n/a'}) + visok DNF rizik` });
    } else if (expensiveAndSlow && poorPractice) {
      weakLinks.push({ code: id, type: "sell_before_drop",
        reason: `Skup ($${price}M) + slab tempo u treninzima → rizik pada cijene` });
    }
  }

  // ── Step 4 & 5: Transfer optimization ────────────────────────────────────
  interface Swap {
    out:string; in:string; outPrice:number; inPrice:number;
    delta:number; deltaEV:number; isConstructor:boolean;
    outConf:"HIGH"|"MEDIUM"|"LOW"; inConf:"HIGH"|"MEDIUM"|"LOW";
  }

  const candidates: Swap[] = [];
  const penalty = (n: number) => Math.max(0, n - freeTransfers) * 10;

  // Build candidate driver swaps
  for (const out of currentDrivers) {
    const outPrice = allDriverData[out]?.price ?? 0;
    const outEV = evMap[out]?.ev ?? 0;
    // "Don't touch winners" (spec §1 pt.7): skip if very high EV
    if (outEV > 20 && (evMap[out]?.confidence ?? "LOW") !== "LOW") continue;

    for (const [code,d] of Object.entries(allDriverData as Record<string,any>)) {
      if (currentDrivers.includes(code)) continue;
      const inPrice = (d as any).price as number;
      const inEV = evMap[code]?.ev ?? 0;
      const deltaEV = inEV - outEV;
      if (deltaEV <= 0.5) continue; // no meaningful gain
      const delta = inPrice - outPrice;
      if (delta > remainingBudget + 0.05) continue; // budget check
      candidates.push({
        out, in:code, outPrice, inPrice, delta, deltaEV,
        isConstructor:false,
        outConf: evMap[out]?.confidence ?? "LOW",
        inConf: evMap[code]?.confidence ?? "LOW",
      });
    }
  }

  // Build candidate constructor swaps
  for (const out of currentConstructors) {
    const outPrice = constructorData[out]?.price ?? 0;
    const outEV = evMap[out]?.ev ?? 0;
    if (outEV > 45) continue; // don't touch dominant constructors

    for (const [id,c] of Object.entries(constructorData as Record<string,any>)) {
      if (currentConstructors.includes(id)) continue;
      const inPrice = (c as any).price as number;
      const inEV = evMap[id]?.ev ?? 0;
      const deltaEV = inEV - outEV;
      if (deltaEV <= 0.5) continue;
      const delta = inPrice - outPrice;
      if (delta > remainingBudget + 0.05) continue;
      candidates.push({
        out, in:id, outPrice, inPrice, delta, deltaEV,
        isConstructor:true,
        outConf: evMap[out]?.confidence ?? "LOW",
        inConf: evMap[id]?.confidence ?? "LOW",
      });
    }
  }

  // Prioritize: weak links first, then best ΔEV
  candidates.sort((a,b) => {
    const aIsWeak = weakLinks.some(w=>w.code===a.out) ? 2 : 0;
    const bIsWeak = weakLinks.some(w=>w.code===b.out) ? 2 : 0;
    return (b.deltaEV + bIsWeak) - (a.deltaEV + aIsWeak);
  });

  const top = candidates.slice(0, 30);
  const n = top.length;
  let bestSwaps: Swap[] = [], bestNet = 0, considered = 0;

  const noOverlap = (swaps: Swap[]) => {
    const outs=swaps.map(s=>s.out), ins=swaps.map(s=>s.in);
    return new Set(outs).size===outs.length && new Set(ins).size===ins.length &&
      !outs.some(o=>ins.includes(o));
  };
  const checkBudget = (swaps: Swap[], budget: number) => {
    let b = budget;
    for (const s of [...swaps].sort((a,b)=>a.delta-b.delta)) {
      b = parseFloat((b - s.delta).toFixed(2));
      if (b < -0.05) return null;
    }
    return b;
  };

  // Step 4: free transfers
  for (let i=0;i<n;i++){
    considered++;
    if (checkBudget([top[i]],remainingBudget)===null) continue;
    const net = top[i].deltaEV - penalty(1);
    if (net > bestNet){bestNet=net; bestSwaps=[top[i]];}
  }
  for(let i=0;i<n-1;i++){for(let j=i+1;j<n;j++){
    considered++;
    const pair=[top[i],top[j]];
    if(!noOverlap(pair)) continue;
    if(checkBudget(pair,remainingBudget)===null) continue;
    const net=top[i].deltaEV+top[j].deltaEV-penalty(2);
    if(net>bestNet){bestNet=net;bestSwaps=pair;}
  }}

  // Step 5: paid transfers — only if ΔEV > penalty (10), apply stricter threshold
  // when practice noise is high (spec §5, §3 Korak 5)
  const paidThreshold = weekend.noiseLevel === "high" ? 14 :
                        weekend.noiseLevel === "medium" ? 12 : 10;

  for(let i=0;i<n-2;i++){for(let j=i+1;j<n-1;j++){for(let k=j+1;k<n;k++){
    considered++;
    const triple=[top[i],top[j],top[k]];
    if(!noOverlap(triple)) continue;
    if(checkBudget(triple,remainingBudget)===null) continue;
    const gross=top[i].deltaEV+top[j].deltaEV+top[k].deltaEV;
    const pen=penalty(3);
    const net=gross-pen;
    // At least one paid transfer — apply stricter threshold
    if(3>freeTransfers && (gross/3)<paidThreshold) continue;
    if(net>bestNet){bestNet=net;bestSwaps=triple;}
  }}}

  // Format output
  const ordered=[...bestSwaps].sort((a,b)=>a.delta-b.delta);
  let budget=remainingBudget;
  const transfers=ordered.map((s,i)=>{
    budget=parseFloat((budget-s.delta).toFixed(2));
    const isFree=i<freeTransfers, pen=isFree?0:10;
    const isWeakLink = weakLinks.find(w=>w.code===s.out);
    return {
      out:s.out, in:s.in,
      transferNumber:i+1, isFree, penaltyCost:pen,
      deltaEV:parseFloat(s.deltaEV.toFixed(1)),
      netGain:parseFloat((s.deltaEV-pen).toFixed(1)),
      budgetDelta:parseFloat((-s.delta).toFixed(1)),
      budgetAfterTransfer:budget,
      feasible:true, isConstructor:s.isConstructor,
      inConfidence: s.inConf,
      outReason: isWeakLink?.reason ?? null,
      weakLinkType: isWeakLink?.type ?? null,
    };
  });

  // Sessions remaining warning
  const remainingSessions = 3 - weekend.sessionsCompleted;
  const sessionsWarning = remainingSessions > 0
    ? `Preostaje ${remainingSessions} trening ${remainingSessions===1?"sesija":"sesije"} prije qualifyinga — ` +
      `procjene su ${weekend.noiseLevel==="high"?"niske":"srednje"} pouzdanosti. ` +
      `Potvrdi prijedlog nakon zadnjeg treninga.`
    : null;

  return {
    transfers, recommendedBoost, boostChanged, weakLinks,
    noTransferScore, totalNetGain: parseFloat(bestNet.toFixed(1)),
    considered, sessionsWarning,
  };
}

// ─── Chip scorer ──────────────────────────────────────────────────────────────
const CHIP_ICONS: Record<string,string> = {
  wildcard:"🃏",limitless:"♾️",no_negative:"🛡️",extra_drs:"🚀",autopilot:"🤖",final_fix:"🔧"
};
interface ChipScore{chip:string;icon:string;score:number;label:"PREPORUČENO"|"DOBRO"|"SAČUVAJ";reason:string}

function scoreChips(chips:string[],track:{isSprint:boolean;circuitType:string;round:number},
  totalRounds:number,avgDnfRate:number,pred:number):ChipScore[]{
  return chips.map(chip=>{
    let score=0,reason="";
    switch(chip){
      case"limitless":score=Math.round(pred*55+(track.isSprint?30:5));
        reason=track.isSprint?"Sprint + predvidiva staza — idealno za Limitless."
          :pred>0.65?`Predvidiva (${Math.round(pred*100)}%) — dobar timing.`:"Sačuvaj za Monza/Bahrain.";break;
      case"no_negative":score=Math.min(100,Math.round(avgDnfRate*180+(track.circuitType==="street"?32:0)));
        reason=track.circuitType==="street"?`Street — visok DNF (${Math.round(avgDnfRate*100)}%). Idealan.`
          :avgDnfRate>0.15?`DNF rate ${Math.round(avgDnfRate*100)}%.`:"Bolje za street ili mokru utrku.";break;
      case"extra_drs":score=track.isSprint?88:Math.round(45+pred*25);
        reason=track.isSprint?"Sprint: Extra DRS=3×. Maksimalan EV.":"Stavi na dominantnog vozača.";break;
      case"autopilot":score=track.isSprint?72:Math.round(20+(1-pred)*35);
        reason=track.isSprint?"Sprint — AutoPilot auto bira DRS.":"Extra DRS je jači chip.";break;
      case"wildcard":score=35;reason="Korisno samo ako tim loše performira 3+ utrke.";break;
      case"final_fix":score=Math.round((track.round/totalRounds)*55+(track.isSprint?18:0));
        reason=track.round>=totalRounds*0.75?"Kasna sezona — Final Fix najvrijedniji."
          :`Sačuvaj za R${Math.round(totalRounds*0.75)}+.`;break;
    }
    return{chip,icon:CHIP_ICONS[chip]??"🎯",score,
      label:(score>=68?"PREPORUČENO":score>=42?"DOBRO":"SAČUVAJ")as ChipScore["label"],reason};
  }).sort((a,b)=>b.score-a.score);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json(
    {error:"GROQ_API_KEY nije postavljen."},{status:500});

  const log: string[] = [];
  const t0 = Date.now();
  const tick = (msg: string) => { log.push(`${Date.now()-t0}ms: ${msg}`); console.log(msg); };

  try {
    tick("START parse body");
    const body = await req.json();
    const {mode="existing",team,track,allDriverData={},constructorData={},
      availableChips=[],freeTransfers=2,remainingBudget=2,totalBudget=100} = body;

    const isFresh = mode==="fresh";
    const circuitId = CIRCUIT_IDS[track.id]??track.id;
    tick(`mode=${mode} track=${track.id} circuitId=${circuitId}`);

    // 1. Fetch external data
    const emptyForm: Record<string, DForm> = {};
    const emptyTrack = { stats: {} as Record<string,THistory>, avgDnfRate: 0.08 };
    const weekendFallback: WeekendData = {
      qualiSimScores:{}, longRunScores:{}, gridPositions:{},
      sessionsCompleted:0, sessionNames:[], noiseLevel:"high", available:false,
    };

    tick("START parallel fetch");
    const [driverForm, trackResult, weekend] = await Promise.all([
      Promise.race([
        getForm(2026),
        new Promise<Record<string,DForm>>(r=>setTimeout(()=>r(emptyForm), 6000)),
      ]),
      Promise.race([
        getTrackHistory(circuitId),
        new Promise<typeof emptyTrack>(r=>setTimeout(()=>r(emptyTrack), 6000)),
      ]),
      Promise.race([
        getWeekendData(track.id, 2026),
        new Promise<WeekendData>(r=>setTimeout(()=>r(weekendFallback), 6000)),
      ]),
    ]);
    const {stats:trackStats, avgDnfRate} = trackResult;
    tick(`fetch done: form=${Object.keys(driverForm).length} drivers, track=${Object.keys(trackStats).length}, weekend=${weekend.available}`);

    // 2. EV calculation
    tick("START EV calc");
    const evMap: Record<string,{ev:number,confidence:"HIGH"|"MEDIUM"|"LOW",components:any}> = {};
    for (const [code,d] of Object.entries(allDriverData as Record<string,any>)) {
      evMap[code] = calcEV(code,(d as any).team,driverForm,trackStats,weekend,track.id,track.isSprint);
    }
    for (const [id,c] of Object.entries(constructorData as Record<string,any>)) {
      const dCodes:string[]=(c as any).drivers??[];
      const dSum = dCodes.reduce((s,dc)=>s+(evMap[dc]?.ev??0),0);
      const constrEV = dSum > 0 ? dSum + 6 : (DRIVER_BASELINE[id]??15)*(TEAM_FACTOR[id]??0.85);
      const confs = dCodes.map(dc=>evMap[dc]?.confidence??"LOW");
      const conf = confs.every(c=>c==="HIGH")?"HIGH":confs.some(c=>c==="MEDIUM")?"MEDIUM":"LOW";
      evMap[id] = { ev:parseFloat(constrEV.toFixed(1)), confidence:conf, components:{} };
    }
    tick(`EV done: ${Object.keys(evMap).length} assets`);

    // 3. Optimize
    const pred = Math.max(0,Math.min(1,1-avgDnfRate*2.5-(track.circuitType==="street"?0.2:0)));
    const chipScores = scoreChips(availableChips, track, 22, avgDnfRate, pred);
    let optResult: any = {};
    let noTransferScore = 0;

    tick("START optimizer");
    if (isFresh) {
      const dOpts = Object.entries(allDriverData as Record<string,any>)
        .map(([code,d]:any)=>({
          code, price:d.price as number, ev:evMap[code]?.ev??0,
          dnfRate:driverForm[code]?.dnfRate??0.08,
          avgPts:driverForm[code]?.avgPts??0,
        }));
      const cOpts = Object.entries(constructorData as Record<string,any>)
        .map(([id,c]:any)=>({id, price:c.price as number, ev:evMap[id]?.ev??0}));
      optResult = freshOptimize(dOpts, cOpts, totalBudget);
      tick(`fresh optimizer done: ${optResult.drivers?.join(",")} | cost=$${optResult.totalCost} | EV=${optResult.totalEV}`);
    } else {
      const cur = team?.drivers??[], curC = team?.constructors??[];
      const pipeResult = pipelineOptimize(
        cur, curC, team?.captain??"", allDriverData, constructorData, evMap,
        remainingBudget, freeTransfers, weekend
      );
      noTransferScore = pipeResult.noTransferScore;
      optResult = pipeResult;
      tick(`transfer optimizer done: ${optResult.transfers?.length} transfers`);
    }

    // 4. Build Groq prompt (trimmed to avoid large payloads)
    tick("START Groq");
    const teamCodes = isFresh ? (optResult.drivers??[]) : (team?.drivers??[]);
    const allCodes = [...teamCodes,...(isFresh?optResult.constructors??[]:(team?.constructors??[]))];
    const evLines = allCodes.map((c:string)=>`${c}:${evMap[c]?.ev?.toFixed(1)}[${evMap[c]?.confidence}]`).join(" ");

    const SYSTEM = `F1 Fantasy analitičar. Odgovaraj kratko u JSON formatu na bosanskom/hrvatskom.`;

    const shortPrompt = isFresh
      ? `Tim za ${track.name} R${track.round}: vozači=${optResult.drivers?.join(",")} konstruktori=${optResult.constructors?.join(",")} boost=${optResult.boostDriver} cijena=$${optResult.totalCost}M EV=${optResult.totalEV}pts arhetip=${optResult.archetype}. EV: ${evLines}. Vrati JSON: {"drsBoostRecommendation":{"driverId":"${optResult.boostDriver}","reason":"kratko"},"teamRationale":"1-2 rečenice","analysis":"1-2 rečenice"}`
      : `Tim za ${track.name}: ${team?.drivers?.join(",")} | boost=${team?.captain} | budžet=$${remainingBudget}M | transferi=${freeTransfers}. EV: ${evLines}. Transferi: ${optResult.transfers?.map((t:any)=>`${t.out}→${t.in}+${t.deltaEV}pts`).join(" ")||"nema"}. Vrati JSON: {"drsBoostRecommendation":{"driverId":"${optResult.recommendedBoost||team?.captain}","reason":"kratko"},"analysis":"1-2 rečenice"}`;

    let aiParsed:any = {};
    try {
      const groqRes = await Promise.race([
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:"POST",
          headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
          body:JSON.stringify({
            model:"llama-3.3-70b-versatile", temperature:0.2, max_tokens:400,
            response_format:{type:"json_object"},
            messages:[{role:"system",content:SYSTEM},{role:"user",content:shortPrompt}],
          }),
        }),
        new Promise<Response>((_,rej) => setTimeout(()=>rej(new Error("Groq timeout")), 8000)),
      ]);
      if (groqRes.ok) {
        const txt = (await groqRes.json()).choices?.[0]?.message?.content??"{}";
        aiParsed = JSON.parse(txt);
        tick("Groq OK");
      } else {
        tick(`Groq FAIL ${groqRes.status}`);
      }
    } catch(e:any) {
      tick(`Groq ERROR: ${e.message}`);
      // Continue without AI — return results based on optimizer only
    }

    // 5. Build response
    tick("START build response");
    const expPts = Object.fromEntries(Object.entries(evMap).map(([k,v])=>[k,parseFloat(v.ev.toFixed(1))]));

    const resp: any = {
      mode,
      chipRecommendations: chipScores,
      bestChip: chipScores[0]?.chip??"",
      drsBoostRecommendation: aiParsed.drsBoostRecommendation ?? {
        driverId: isFresh ? (optResult.boostDriver??"") : (optResult.recommendedBoost??""),
        reason: "Najviši EV u timu ovaj vikend.",
      },
      analysis: aiParsed.analysis??"",
      allExpectedPts: expPts,
      dataStatus:{
        form2026: Object.keys(driverForm).length>0?"OK":"UNAVAILABLE",
        trackHistory: Object.keys(trackStats).length>0?"OK":"UNAVAILABLE",
        weekendData: weekend.available?`${weekend.sessionsCompleted} sesija`:"UNAVAILABLE",
        gridAvailable: Object.keys(weekend.gridPositions).length>0,
        noiseLevel: weekend.noiseLevel,
        transfersConsidered: optResult.considered??0,
        _log: log,
      },
    };

    if(isFresh){
      resp.suggestedDrivers      = optResult.drivers??[];
      resp.suggestedConstructors = optResult.constructors??[];
      resp.boostDriver           = optResult.boostDriver??"";
      resp.captain               = optResult.boostDriver??"";
      resp.totalCost             = optResult.totalCost??0;
      resp.remainingBudget       = optResult.remainingBudget??0;
      resp.totalExpectedPoints   = optResult.totalEV??0;
      resp.archetype             = optResult.archetype??"unknown";
      resp.avoidList             = optResult.avoidList??[];
      resp.considered            = optResult.considered??0;
      resp.teamRationale         = aiParsed.teamRationale??"";
      resp.recommendedTeam       = {
        drivers: optResult.drivers??[],
        constructors: optResult.constructors??[],
        changedDrivers: optResult.drivers??[],
        changedConstructors: optResult.constructors??[],
        unchanged: false,
      };
      resp.predictedPoints    = Object.fromEntries((optResult.drivers??[]).map((c:string)=>[c,expPts[c]??0]));
      resp.constructorPoints  = Object.fromEntries((optResult.constructors??[]).map((c:string)=>[c,expPts[c]??0]));
    } else {
      const fc=optResult.transfers?.filter((t:any)=>t.isFree).length??0;
      const pc=optResult.transfers?.filter((t:any)=>!t.isFree).length??0;
      resp.transfers         = optResult.transfers??[];
      resp.weakLinks         = optResult.weakLinks??[];
      resp.boostChanged      = optResult.boostChanged??false;
      resp.sessionsWarning   = optResult.sessionsWarning??null;
      resp.totalExpectedPoints = noTransferScore;
      resp.totalExpectedPointsAfterTransfers = parseFloat((noTransferScore+(optResult.totalNetGain??0)).toFixed(1));
      resp.totalTransferCost = pc*10;
      resp.totalNetGain      = optResult.totalNetGain??0;
      resp.recommendedTeam   = {
        drivers:[...(team?.drivers??[])].map((id:string)=>{
          const t=optResult.transfers?.find((t:any)=>t.out===id&&!t.isConstructor);
          return t?t.in:id;
        }),
        constructors:[...(team?.constructors??[])].map((id:string)=>{
          const t=optResult.transfers?.find((t:any)=>t.out===id&&t.isConstructor);
          return t?t.in:id;
        }),
        changedDrivers:optResult.transfers?.filter((t:any)=>!t.isConstructor).map((t:any)=>t.in)??[],
        changedConstructors:optResult.transfers?.filter((t:any)=>t.isConstructor).map((t:any)=>t.in)??[],
        unchanged:(optResult.transfers?.length??0)===0,
      };
      resp.transferSummary   = resp.transfers.length===0
        ?"Nema isplativih transfera ovaj vikend."
        :`${fc} besplatn${fc===1?"i":"a"} transfer${pc>0?` + ${pc} plaćen${pc===1?"i":"a"} (−${pc*10} pts)`:""} · neto: +${resp.totalNetGain} pts`;
      resp.predictedPoints   = Object.fromEntries((team?.drivers??[]).map((c:string)=>[c,expPts[c]??0]));
      resp.constructorPoints = Object.fromEntries((team?.constructors??[]).map((c:string)=>[c,expPts[c]??0]));
    }

    tick("DONE");
    return NextResponse.json(resp);

  } catch(err:any) {
    console.error("PREDICT ERROR:", err);
    return NextResponse.json({
      error: err.message ?? "Nepoznata greška",
      stack: err.stack?.slice(0, 500),
      log,
    }, {status: 500});
  }
}
