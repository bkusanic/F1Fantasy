import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

async function runDiagnostics() {
  const start = Date.now();
  const results: Record<string, any> = {};

  try {
    const r = await Promise.race([
      fetch("https://api.jolpi.ca/ergast/f1/2026/results.json?limit=10"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout 4s")), 4000)),
    ]) as Response;
    results.jolpicaForm = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.jolpicaForm = `ERROR: ${e.message}`; }

  try {
    const r = await Promise.race([
      fetch("https://api.jolpi.ca/ergast/f1/2025/circuits/villeneuve/results.json?limit=5"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout 4s")), 4000)),
    ]) as Response;
    results.jolpicaTrack = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.jolpicaTrack = `ERROR: ${e.message}`; }

  try {
    const r = await Promise.race([
      fetch("https://api.openf1.org/v1/sessions?year=2026&circuit_short_name=Villeneuve"),
      new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout 4s")), 4000)),
    ]) as Response;
    results.openf1 = r.ok ? `OK ${r.status}` : `FAIL ${r.status}`;
  } catch(e: any) { results.openf1 = `ERROR: ${e.message}`; }

  const key = process.env.GROQ_API_KEY;
  results.groqKey = key ? `SET (${key.slice(0,8)}...)` : "MISSING ← PROBLEM!";
  results.totalMs = Date.now() - start;
  return results;
}

export async function GET() {
  const results = await runDiagnostics();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const results = await runDiagnostics();
  results.receivedMode = body?.mode ?? "no-body";
  return NextResponse.json(results);
}
