import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "";

  try {
    const res = await fetch(`https://api.jolpi.ca/ergast/f1${path}.json?limit=100`, {
      next: { revalidate: 86400 }, // 24h cache for historical data
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
