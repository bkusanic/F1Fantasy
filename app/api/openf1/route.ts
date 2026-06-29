import { NextRequest, NextResponse } from "next/server";

// OpenF1 proxy — avoids CORS issues from browser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "";

  try {
    const res = await fetch(`https://api.openf1.org/v1${path}`, {
      next: { revalidate: 1800 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
