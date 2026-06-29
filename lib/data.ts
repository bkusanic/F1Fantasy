/**
 * Data fetching layer
 * OpenF1 API  → current season live data
 * Jolpica API → historical results (3 seasons)
 */

// ─── OpenF1 ──────────────────────────────────────────────────────────────────

const OPENF1_BASE = "https://api.openf1.org/v1";

export interface OpenF1SessionResult {
  driverNumber: number;
  nameAcronym: string;
  position: number | null;
  gridPosition: number;
  teamName: string;
}

export interface OpenF1Session {
  sessionKey: number;
  sessionName: string;  // "Race", "Qualifying", "Sprint"
  dateStart: string;
  year: number;
  circuitShortName: string;
  roundNumber: number;
}

async function openf1Fetch<T>(path: string): Promise<T> {
  const res = await fetch(`${OPENF1_BASE}${path}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`OpenF1 error: ${res.status}`);
  return res.json();
}

/** Get the last N completed race sessions for current season */
export async function getRecentRaceSessions(year: number, count = 3): Promise<OpenF1Session[]> {
  const sessions = await openf1Fetch<any[]>(
    `/sessions?year=${year}&session_name=Race&date_end%3C${new Date().toISOString()}`
  );
  return sessions
    .sort((a, b) => new Date(b.date_end).getTime() - new Date(a.date_end).getTime())
    .slice(0, count)
    .map((s) => ({
      sessionKey: s.session_key,
      sessionName: s.session_name,
      dateStart: s.date_start,
      year: s.year,
      circuitShortName: s.circuit_short_name,
      roundNumber: s.round_number ?? 0,
    }));
}

/** Get race results for a specific session */
export async function getRaceResults(sessionKey: number): Promise<OpenF1SessionResult[]> {
  const [positions, drivers] = await Promise.all([
    openf1Fetch<any[]>(`/position?session_key=${sessionKey}&date%3E9999`), // final positions
    openf1Fetch<any[]>(`/drivers?session_key=${sessionKey}`),
  ]);

  return drivers.map((d) => {
    const finalPos = positions
      .filter((p) => p.driver_number === d.driver_number)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return {
      driverNumber: d.driver_number,
      nameAcronym: d.name_acronym,
      position: finalPos?.position ?? null,
      gridPosition: 20, // fallback — Jolpica has accurate grid
      teamName: d.team_name,
    };
  });
}

/** Get driver form: last 3 races of current season */
export async function getDriverForm(year: number): Promise<
  Record<string, { avgPoints: number; dnfRate: number; avgPosition: number; races: any[] }>
> {
  try {
    const sessions = await getRecentRaceSessions(year, 3);
    const allResults = await Promise.all(sessions.map((s) => getRaceResults(s.sessionKey)));

    const form: Record<string, { total: number; dnfs: number; positions: number[]; races: any[] }> = {};

    sessions.forEach((session, i) => {
      allResults[i].forEach((r) => {
        if (!form[r.nameAcronym]) form[r.nameAcronym] = { total: 0, dnfs: 0, positions: [], races: [] };
        const isDNF = r.position === null || r.position > 20;
        form[r.nameAcronym].dnfs += isDNF ? 1 : 0;
        if (!isDNF) form[r.nameAcronym].positions.push(r.position!);
        form[r.nameAcronym].races.push({ circuit: session.circuitShortName, position: r.position });
      });
    });

    return Object.fromEntries(
      Object.entries(form).map(([code, data]) => [
        code,
        {
          avgPoints: data.total / Math.max(sessions.length, 1),
          dnfRate: data.dnfs / Math.max(sessions.length, 1),
          avgPosition: data.positions.length
            ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
            : 18,
          races: data.races,
        },
      ])
    );
  } catch {
    return {};
  }
}

// ─── Jolpica (Ergast replacement) ────────────────────────────────────────────

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

async function jolpikaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${JOLPICA_BASE}${path}.json?limit=100`, {
    next: { revalidate: 86400 }, // 24h cache for historical data
  });
  if (!res.ok) throw new Error(`Jolpica error: ${res.status}`);
  const json = await res.json();
  return json.MRData;
}

export interface TrackHistoryEntry {
  year: number;
  driverCode: string;
  position: number | null;
  gridPosition: number;
  status: string; // "Finished", "Accident", etc.
}

/** Historical race results for a specific circuit over the last N seasons */
export async function getTrackHistory(
  circuitId: string,    // jolpica circuit ID e.g. "monaco", "monza"
  yearsBack = 3
): Promise<TrackHistoryEntry[]> {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: yearsBack }, (_, i) => currentYear - 1 - i);

  const results = await Promise.all(
    years.map(async (year) => {
      try {
        const data = await jolpikaFetch<any>(`/${year}/circuits/${circuitId}/results`);
        const race = data.RaceTable?.Races?.[0];
        if (!race) return [];
        return race.Results.map((r: any) => ({
          year,
          driverCode: r.Driver.code,
          position: r.position === "R" || r.position === "D" || r.position === "E"
            ? null
            : parseInt(r.position),
          gridPosition: parseInt(r.grid),
          status: r.status,
        }));
      } catch {
        return [];
      }
    })
  );

  return results.flat();
}

/** Get current season driver standings */
export async function getCurrentStandings(year: number): Promise<
  { driverCode: string; position: number; points: number; wins: number }[]
> {
  try {
    const data = await jolpikaFetch<any>(`/${year}/driverStandings`);
    const standings = data.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
    return standings.map((s: any) => ({
      driverCode: s.Driver.code,
      position: parseInt(s.position),
      points: parseFloat(s.points),
      wins: parseInt(s.wins),
    }));
  } catch {
    return [];
  }
}

/** Get qualifying results for current season last race */
export async function getLatestQualifying(year: number): Promise<
  { driverCode: string; position: number }[]
> {
  try {
    const data = await jolpikaFetch<any>(`/${year}/last/qualifying`);
    const results = data.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
    return results.map((r: any) => ({
      driverCode: r.Driver.code,
      position: parseInt(r.position),
    }));
  } catch {
    return [];
  }
}

// ─── Jolpica Circuit ID mapping ───────────────────────────────────────────────
// Maps our internal track IDs to Jolpica circuit IDs

export const JOLPICA_CIRCUIT_IDS: Record<string, string> = {
  aus: "albert_park",
  chn: "shanghai",
  jpn: "suzuka",
  bhr: "bahrain",
  sau: "jeddah",
  mia: "miami",
  imo: "imola",
  mon: "monaco",
  esp: "catalunya",
  can: "villeneuve",
  aut: "red_bull_ring",
  gbr: "silverstone",
  bel: "spa",
  hun: "hungaroring",
  nld: "zandvoort",
  ita: "monza",
  aze: "baku",
  sgp: "marina_bay",
  usc: "americas",
  mex: "rodriguez",
  bra: "interlagos",
  lvg: "las_vegas",
  qat: "losail",
  abu: "yas_marina",
};
