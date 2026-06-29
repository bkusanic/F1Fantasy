// ─── Core Fantasy Types ──────────────────────────────────────────────────────

export type ChipName =
  | "wildcard"
  | "limitless"
  | "no_negative"
  | "extra_drs"
  | "autopilot"
  | "final_fix";

export type SessionType = "qualifying" | "sprint" | "race";

export interface Driver {
  id: string;
  name: string;
  shortName: string;      // e.g. "VER", "NOR"
  team: string;
  price: number;          // in millions, e.g. 30.5
  driverNumber: number;
}

export interface Constructor {
  id: string;
  name: string;
  shortName: string;
  price: number;
  drivers: string[];      // driver ids
}

export interface Track {
  id: string;
  name: string;
  country: string;
  circuitType: "street" | "permanent" | "hybrid";
  isSprint: boolean;
  round: number;
  date: string;
}

// ─── User Team ───────────────────────────────────────────────────────────────

export interface UserTeam {
  drivers: string[];          // 5 driver ids
  constructors: string[];     // 2 constructor ids
  captain: string;            // driver id (DRS Boost — 2×)
  extraDrsDriver?: string;    // for Extra DRS chip (3×)
  budget: number;             // $100M cap
  usedChips: ChipName[];
  activeChip?: ChipName;
}

// ─── Race Results / Form ─────────────────────────────────────────────────────

export interface RaceResult {
  driverId: string;
  position: number | null;    // null = DNF/DNS
  gridPosition: number;
  fastestLap: boolean;
  driverOfDay: boolean;
  points: number;             // actual F1 Championship points
  fantasyPoints: number;      // calculated F1 Fantasy points
}

export interface RaceWeekend {
  trackId: string;
  round: number;
  year: number;
  results: RaceResult[];
  constructorResults: ConstructorResult[];
  isSprint: boolean;
  sprintResults?: RaceResult[];
}

export interface ConstructorResult {
  constructorId: string;
  fastestPitStop: boolean;
  secondFastestPitStop: boolean;
  fantasyPoints: number;
}

// ─── Driver Form ─────────────────────────────────────────────────────────────

export interface DriverForm {
  driverId: string;
  last3Races: {
    round: number;
    trackId: string;
    position: number | null;
    gridPosition: number;
    fantasyPoints: number;
  }[];
  avgFantasyPoints: number;
  avgPosition: number;
  dnfRate: number;            // 0–1
  trend: "up" | "down" | "stable";
}

// ─── Track History ────────────────────────────────────────────────────────────

export interface TrackHistory {
  trackId: string;
  driverId: string;
  results: {
    year: number;
    position: number | null;
    gridPosition: number;
    fantasyPoints: number;
  }[];
  avgPosition: number;
  avgFantasyPoints: number;
  dnfRate: number;
  bestResult: number;
}

// ─── Predictions ─────────────────────────────────────────────────────────────

export interface DriverPrediction {
  driverId: string;
  predictedPosition: number;
  predictedFantasyPoints: number;
  confidence: "high" | "medium" | "low";
  drsBoostEV: number;         // EV if DRS Boost applied (2×)
  extraDrsEV: number;         // EV if Extra DRS applied (3×)
  valueScore: number;         // points/price ratio
  formScore: number;          // 0–100
  trackScore: number;         // 0–100 (historical performance on this track)
  notes: string[];
}

export interface TeamPrediction {
  totalExpectedPoints: number;
  driverPredictions: DriverPrediction[];
  constructorPoints: { constructorId: string; points: number }[];
  drsBoostRecommendation: string;
  transferRecommendations: TransferRecommendation[];
  chipRecommendation: ChipRecommendation | null;
  aiAnalysis: string;
}

export interface TransferRecommendation {
  out: string;          // driver id to remove
  in: string;           // driver id to add
  budgetDelta: number;  // positive = get money, negative = spend
  pointsGainEV: number;
  reason: string;
}

export interface ChipRecommendation {
  chip: ChipName;
  reason: string;
  evGain: number;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  session_key: number;
}

export interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
}

export interface JolpikaResult {
  season: string;
  round: string;
  raceName: string;
  Results: {
    position: string;
    Driver: { driverId: string; code: string; familyName: string };
    Constructor: { constructorId: string; name: string };
    grid: string;
    status: string;
    FastestLap?: { rank: string };
  }[];
}
