import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN nije postavljen u Vercel env vars");
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function repoInfo() {
  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  if (!owner || !repo) throw new Error("GITHUB_OWNER ili GITHUB_REPO nisu postavljeni u Vercel env vars");
  return { owner, repo };
}

/** Parse constants.ts line-by-line — reliable since each entry is one line */
function parseConstants(content: string) {
  const lines = content.split("\n");
  const drivers: { shortName: string; name: string; price: number }[] = [];
  const constructors: { id: string; name: string; price: number }[] = [];

  for (const line of lines) {
    // Driver lines contain "driverNumber" — unique to driver entries
    if (line.includes("driverNumber")) {
      const sn    = line.match(/shortName:\s*"([A-Z]+)"/)?.[1];
      const nm    = line.match(/name:\s*"([^"]+)"/)?.[1];
      const price = line.match(/price:\s*([\d.]+)/)?.[1];
      if (sn && nm && price) drivers.push({ shortName:sn, name:nm, price:parseFloat(price) });
    }
    // Constructor lines contain "drivers: [" — unique to constructor entries
    if (line.includes("drivers: [")) {
      const id    = line.match(/id:\s*"([a-z]+)"/)?.[1];
      const nm    = line.match(/name:\s*"([^"]+)"/)?.[1];
      const price = line.match(/price:\s*([\d.]+)/)?.[1];
      if (id && nm && price) constructors.push({ id, name:nm, price:parseFloat(price) });
    }
  }
  return { drivers, constructors };
}

/** Update a price value in the line matching the given key */
function updatePrice(content: string, lineMarker: string, matchKey: string, newPrice: number): string {
  const lines = content.split("\n");
  return lines.map(line => {
    if (!line.includes(lineMarker)) return line;
    if (!line.includes(matchKey)) return line;
    return line.replace(/price:\s*[\d.]+/, `price: ${newPrice.toFixed(1)}`);
  }).join("\n");
}

// ─── GET: read current prices ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("password");
  if (!pass || pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Neispravna lozinka" }, { status: 401 });
  }
  try {
    const { owner, repo } = repoInfo();
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      { headers: githubHeaders() }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API: ${res.status} — ${err}`);
    }
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const { drivers, constructors } = parseConstants(content);
    const lastUpdated = content.match(/Zadnje ažuriranje:\s*([^\n(]+)/)?.[1]?.trim() ?? "—";
    return NextResponse.json({ drivers, constructors, sha: data.sha, lastUpdated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: save updated prices ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { password, drivers, constructors } = await req.json();
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Neispravna lozinka" }, { status: 401 });
    }

    const { owner, repo } = repoInfo();

    // Read current file
    const fileRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      { headers: githubHeaders() }
    );
    if (!fileRes.ok) throw new Error(`Čitanje: ${fileRes.status}`);
    const fileData = await fileRes.json();
    let content = Buffer.from(fileData.content, "base64").toString("utf-8");

    // Update driver prices (each driver is on one line containing "driverNumber")
    for (const d of drivers as { shortName: string; price: number }[]) {
      content = updatePrice(content, "driverNumber", `shortName: "${d.shortName}"`, d.price);
    }

    // Update constructor prices (each constructor line contains "drivers: [")
    for (const c of constructors as { id: string; price: number }[]) {
      content = updatePrice(content, 'drivers: [', `id: "${c.id}"`, c.price);
    }

    // Update "last updated" date
    const dateStr = new Date().toLocaleDateString("hr-HR", { day:"2-digit", month:"2-digit", year:"numeric" });
    if (content.includes("Zadnje ažuriranje:")) {
      content = content.replace(/\/\/ Zadnje ažuriranje:[^\n]*/, `// Zadnje ažuriranje: ${dateStr} (admin)`);
    }

    // Commit to GitHub
    const encoded = Buffer.from(content, "utf-8").toString("base64");
    const commitRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      {
        method: "PUT",
        headers: githubHeaders(),
        body: JSON.stringify({
          message: `Ažuriranje cijena F1 Fantasy (${dateStr})`,
          content: encoded,
          sha: fileData.sha,
          branch: "main",
        }),
      }
    );

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      throw new Error(`GitHub commit: ${commitRes.status} — ${errText.slice(0, 200)}`);
    }

    const commitData = await commitRes.json();
    return NextResponse.json({
      success: true,
      commitUrl: commitData.commit?.html_url ?? "",
      message: `Cijene ažurirane! Vercel deploya za ~2 minute.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
