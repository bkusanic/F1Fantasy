import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const start = Date.now();

  const results: Record<string, any> = { received: body?.mode ?? "no-body" };

  // Test 1: Jolpica form
  try {
    const r = await Promise.race([
      fetch("https://api.jolpi.ca/ergast/f1/2026/results.json?limit=10"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]) as Response;
    results.jolpicaForm = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.jolpicaForm = `ERROR: ${e.message}`; }

  // Test 2: Jolpica track
  try {
    const r = await Promise.race([
      fetch("https://api.jolpi.ca/ergast/f1/2025/circuits/villeneuve/results.json?limit=5"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]) as Response;
    results.jolpicaTrack = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.jolpicaTrack = `ERROR: ${e.message}`; }

  // Test 3: OpenF1 sessions
  try {
    const r = await Promise.race([
      fetch("https://api.openf1.org/v1/sessions?year=2026&circuit_short_name=Villeneuve"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]) as Response;
    results.openf1 = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.openf1 = `ERROR: ${e.message}`; }

  // Test 4: Groq API key
  const key = process.env.GROQ_API_KEY;
  results.groqKey = key ? `SET (${key.slice(0,8)}...)` : "MISSING";

  results.totalMs = Date.now() - start;
  return NextResponse.json(results);
}
