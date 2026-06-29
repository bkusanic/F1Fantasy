/**
 * F1 Fantasy Official Scoring Engine
 * Implements complete 2025/2026 scoring rules
 */

import type { RaceResult, ConstructorResult, UserTeam, DriverPrediction } from "./types";

// ─── Qualifying Points ────────────────────────────────────────────────────────

const QUALIFYING_POSITION_POINTS: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6,
  6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};

export function calcQualifyingPoints(
  position: number,
  madeQ3: boolean,
  madeQ2: boolean,
  beatTeammate: boolean
): number {
  let pts = 0;
  if (position <= 10) pts += QUALIFYING_POSITION_POINTS[position] ?? 0;
  if (madeQ3) pts += 3;
  else if (madeQ2) pts += 2;
  if (beatTeammate) pts += 3;
  return pts;
}

// ─── Race Points ──────────────────────────────────────────────────────────────

const RACE_POSITION_POINTS: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

export function calcRacePoints(
  finishPosition: number | null,   // null = DNF/DNS
  gridPosition: number,
  fastestLap: boolean,
  driverOfDay: boolean,
  isSprint: boolean = false
): number {
  // DNF / DNS penalty
  if (finishPosition === null) return isSprint ? -10 : -20;

  let pts = 0;

  if (isSprint) {
    // Sprint scoring (P1–P8 only)
    const SPRINT_POINTS: Record<number, number> = {
      1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1,
    };
    pts += SPRINT_POINTS[finishPosition] ?? 0;
    if (fastestLap) pts += 3;
  } else {
    // Grand Prix scoring
    pts += RACE_POSITION_POINTS[finishPosition] ?? 0;
    if (fastestLap && finishPosition <= 10) pts += 5;
    if (driverOfDay) pts += 10;
  }

  // Positions gained / lost (applies to both GP and Sprint)
  const posChange = gridPosition - (finishPosition ?? gridPosition);
  if (posChange > 0) pts += posChange * 2;      // gained: +2 per position
  else if (posChange < 0) pts += posChange * 1;  // lost: -1 per position

  return pts;
}

// ─── Constructor Points ───────────────────────────────────────────────────────

export function calcConstructorPoints(
  driver1Points: number,
  driver2Points: number,
  fastestPitStop: boolean,
  secondFastestPitStop: boolean
): number {
  let pts = driver1Points + driver2Points;
  if (fastestPitStop) pts += 10;
  if (secondFastestPitStop) pts += 5;
  return pts;
}

// ─── DRS Boost / Extra DRS Multipliers ───────────────────────────────────────

export function applyDrsBoost(basePoints: number, chip?: "drs" | "extra_drs"): number {
  if (chip === "extra_drs") return basePoints * 3;
  if (chip === "drs") return basePoints * 2;
  return basePoints;
}

// ─── No Negative Chip ────────────────────────────────────────────────────────

export function applyNoNegative(points: number, active: boolean): number {
  return active ? Math.max(0, points) : points;
}

// ─── Team Total Score Calculator ──────────────────────────────────────────────

export interface WeekendScore {
  driverScores: { driverId: string; points: number; raw: number }[];
  constructorScores: { constructorId: string; points: number }[];
  total: number;
}

export function calcTeamWeekendScore(
  team: UserTeam,
  driverResults: RaceResult[],
  constructorResults: ConstructorResult[],
  options: {
    noNegative?: boolean;
    isSprint?: boolean;
    extraDrsDriver?: string;
  } = {}
): WeekendScore {
  const { noNegative = false, isSprint = false, extraDrsDriver } = options;

  const driverScores = team.drivers.map((driverId) => {
    const result = driverResults.find((r) => r.driverId === driverId);
    if (!result) return { driverId, points: 0, raw: 0 };

    let pts = result.fantasyPoints;
    const isNoNeg = noNegative;

    // DRS Boost (2×) for captain — weekly
    if (driverId === team.captain && !extraDrsDriver) {
      pts = applyDrsBoost(applyNoNegative(pts, isNoNeg), "drs");
    }
    // Extra DRS chip (3×) — one-time, different driver
    else if (driverId === extraDrsDriver && driverId !== team.captain) {
      pts = applyDrsBoost(applyNoNegative(pts, isNoNeg), "extra_drs");
    } else {
      pts = applyNoNegative(pts, isNoNeg);
    }

    return { driverId, points: pts, raw: result.fantasyPoints };
  });

  const constructorScores = team.constructors.map((constructorId) => {
    const result = constructorResults.find((r) => r.constructorId === constructorId);
    return {
      constructorId,
      points: applyNoNegative(result?.fantasyPoints ?? 0, noNegative),
    };
  });

  const total =
    driverScores.reduce((s, d) => s + d.points, 0) +
    constructorScores.reduce((s, c) => s + c.points, 0);

  return { driverScores, constructorScores, total };
}

// ─── Expected Value Calculator ────────────────────────────────────────────────

/**
 * Blended expected points from:
 * - Recent form (last 3 races, 50% weight)
 * - Track history (last 3 years on this circuit, 35% weight)
 * - Overall season average (15% weight)
 */
export function calcExpectedPoints(
  avgRecentForm: number,        // avg fantasy pts last 3 races
  avgTrackHistory: number,      // avg fantasy pts on this track (3 seasons)
  avgSeasonPoints: number,      // avg fantasy pts this season
  dnfRateRecent: number,        // 0–1
  isSprint: boolean = false
): number {
  const weights = { form: 0.5, track: 0.35, season: 0.15 };
  const base =
    avgRecentForm * weights.form +
    avgTrackHistory * weights.track +
    avgSeasonPoints * weights.season;

  // Sprint weekends generally produce fewer points
  const sprintFactor = isSprint ? 0.75 : 1.0;

  // DNF risk discount: -20pts DNF * probability
  const dnfPenalty = dnfRateRecent * (isSprint ? 10 : 20);

  return Math.max(0, (base - dnfPenalty) * sprintFactor);
}

// ─── Value Score ──────────────────────────────────────────────────────────────

/** Points per million — higher = better value */
export function calcValueScore(expectedPoints: number, price: number): number {
  if (price === 0) return 0;
  return parseFloat((expectedPoints / price).toFixed(3));
}

// ─── Optimal DRS Boost Recommendation ────────────────────────────────────────

export function recommendDrsBoost(predictions: DriverPrediction[]): string {
  const sorted = [...predictions].sort((a, b) => b.drsBoostEV - a.drsBoostEV);
  return sorted[0]?.driverId ?? "";
}

// ─── Budget Validator ─────────────────────────────────────────────────────────

export function validateBudget(
  drivers: { id: string; price: number }[],
  constructors: { id: string; price: number }[],
  cap: number = 100
): { valid: boolean; used: number; remaining: number } {
  const used =
    drivers.reduce((s, d) => s + d.price, 0) +
    constructors.reduce((s, c) => s + c.price, 0);
  return {
    valid: used <= cap,
    used: parseFloat(used.toFixed(1)),
    remaining: parseFloat((cap - used).toFixed(1)),
  };
}

// ─── Transfer Cost ────────────────────────────────────────────────────────────

/**
 * Each team gets 2 free transfers per race.
 * Unused transfers roll over to next race (max 3 banked).
 * Extra transfers cost -10 pts each.
 */
export function calcTransferCost(
  transfersNeeded: number,
  freeTransfers: number
): number {
  const extra = Math.max(0, transfersNeeded - freeTransfers);
  return extra * -10;
}

// ─── Chip Strategy Advisor ────────────────────────────────────────────────────

export interface ChipAdvice {
  chip: string;
  score: number;      // 0–100 urgency
  reason: string;
}

export function adviceForChip(
  chip: string,
  context: {
    isStreetCircuit: boolean;
    isSprint: boolean;
    dnfRateAvg: number;          // avg DNF rate for this track
    predictabilityScore: number; // 0–100, higher = more predictable race
    racesLeft: number;
    currentTeamEV: number;       // current team expected points
    bestPossibleEV: number;      // limitless optimal EV
  }
): ChipAdvice {
  const { isStreetCircuit, isSprint, dnfRateAvg, predictabilityScore, racesLeft, currentTeamEV, bestPossibleEV } = context;

  switch (chip) {
    case "limitless":
      return {
        chip,
        score: predictabilityScore,
        reason:
          predictabilityScore > 70
            ? `Visoka predvidivost (${predictabilityScore}/100) — idealan trenutak. EV gain: +${(bestPossibleEV - currentTeamEV).toFixed(0)} pts`
            : `Sačuvaj za predvidiviju utrku. Trenutna predvidivost: ${predictabilityScore}/100`,
      };
    case "no_negative":
      return {
        chip,
        score: Math.round(dnfRateAvg * 100 + (isStreetCircuit ? 30 : 0)),
        reason:
          isStreetCircuit
            ? `Street circuit — visok rizik od DNF-a i safety cara. Odličan timing.`
            : dnfRateAvg > 0.25
            ? `Visok historijski DNF rate na ovoj stazi (${(dnfRateAvg * 100).toFixed(0)}%). Preporučuje se.`
            : `Prosječan rizik. Sačuvaj za street circuit ili mokru utrku.`,
      };
    case "extra_drs":
      return {
        chip,
        score: isSprint ? 85 : 60,
        reason: isSprint
          ? `Sprint vikend — dvostruki scoring events. Extra DRS = maksimalan EV.`
          : `Koristi na stazi gdje dominantni vozač rijetko gubi pozicije (Monaco, Imola, Bahrain).`,
      };
    case "wildcard":
      return {
        chip,
        score: Math.round(((100 - currentTeamEV / bestPossibleEV * 100) * 0.7)),
        reason:
          currentTeamEV < bestPossibleEV * 0.7
            ? `Tvoj tim underperformuje (${currentTeamEV.toFixed(0)} vs moguće ${bestPossibleEV.toFixed(0)} pts). Wildcard je opravdan.`
            : `Tim je dobro pozicioniran. Sačuvaj wildcard za veći reset.`,
      };
    case "final_fix":
      return {
        chip,
        score: racesLeft <= 5 ? 90 : 40,
        reason:
          racesLeft <= 5
            ? `Ostalo ${racesLeft} utrka — Final Fix maksimizira fleksibilnost u run-in fazi sezone.`
            : `Sačuvaj za kraj sezone ili grid penalty kaos u kasnim rundama.`,
      };
    case "autopilot":
      return {
        chip,
        score: isSprint ? 80 : predictabilityScore < 40 ? 70 : 30,
        reason: isSprint
          ? `Sprint vikend sa neizvjesnim rezultatima — AutoPilot automatski bira DRS Boost na highest scorer.`
          : `Koristi na kaotičnim vikendima (kiša, street circuit) gdje je teško prognozirati top scorer.`,
      };
    default:
      return { chip, score: 0, reason: "Nepoznati chip." };
  }
}
