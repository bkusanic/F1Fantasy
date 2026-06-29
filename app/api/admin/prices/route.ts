import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

function getGithubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN env var nije postavljen");
  return {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function getRepoInfo() {
  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;
  if (!owner || !repo) throw new Error("GITHUB_OWNER ili GITHUB_REPO nisu postavljeni");
  return { owner, repo };
}

// ─── GET: read current prices from constants.ts ────────────────────────────
export async function GET(req: NextRequest) {
  const pass = req.nextUrl.searchParams.get("password");
  if (pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Neispravna lozinka" }, { status: 401 });
  }

  try {
    const { owner, repo } = getRepoInfo();
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      { headers: getGithubHeaders() }
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const sha = data.sha;

    // Parse prices from constants.ts
    const drivers: { shortName: string; price: number; name: string }[] = [];
    const driverRe = /shortName:\s*"([A-Z]+)".*?name:\s*"([^"]+)".*?price:\s*([\d.]+)/gs;
    let m;
    while ((m = driverRe.exec(content)) !== null) {
      drivers.push({ shortName: m[1], name: m[2], price: parseFloat(m[3]) });
    }

    const constructors: { id: string; name: string; price: number }[] = [];
    const constrRe = /id:\s*"([a-z]+)".*?name:\s*"([^"]+)".*?shortName.*?price:\s*([\d.]+)/gs;
    while ((m = constrRe.exec(content)) !== null) {
      constructors.push({ id: m[1], name: m[2], price: parseFloat(m[3]) });
    }

    // Extract "last updated" comment if present
    const lastUpdated = content.match(/Zadnje ažuriranje:\s*([^\n]+)/)?.[1]?.trim() ?? "nepoznato";

    return NextResponse.json({ drivers, constructors, sha, lastUpdated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: update prices in constants.ts ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, drivers, constructors, sha } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Neispravna lozinka" }, { status: 401 });
    }
    if (!drivers?.length || !constructors?.length || !sha) {
      return NextResponse.json({ error: "Nedostaju podaci" }, { status: 400 });
    }

    const { owner, repo } = getRepoInfo();

    // Read current file to preserve everything except prices
    const fileRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      { headers: getGithubHeaders() }
    );
    if (!fileRes.ok) throw new Error(`Čitanje datoteke: ${fileRes.status}`);
    const fileData = await fileRes.json();
    let content = Buffer.from(fileData.content, "base64").toString("utf-8");

    // Update "last updated" comment
    const now = new Date().toLocaleDateString("hr-HR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    content = content.replace(
      /\/\/ Zadnje ažuriranje:[^\n]*/,
      `// Zadnje ažuriranje: ${now} (admin sučelje)`
    );
    // If no such comment, add one
    if (!content.includes("Zadnje ažuriranje:")) {
      content = content.replace(
        "// ⚠️  CIJENE SE MIJENJAJU",
        `// ⚠️  CIJENE SE MIJENJAJU`
      );
    }

    // Update driver prices
    for (const d of drivers) {
      // Match line with this shortName and replace price
      const pattern = new RegExp(
        `(shortName:\\s*"${d.shortName}"[^}]*?price:\\s*)(\\d+\\.\\d+)`,
        "s"
      );
      content = content.replace(pattern, `$1${d.price.toFixed(1)}`);
    }

    // Update constructor prices  
    for (const c of constructors) {
      // Match constructor block by id
      const pattern = new RegExp(
        `(id:\\s*"${c.id}"[^}]*?price:\\s*)(\\d+\\.\\d+)`,
        "s"
      );
      content = content.replace(pattern, `$1${c.price.toFixed(1)}`);
    }

    // Update "last updated" line properly
    const dateStr = new Date().toLocaleDateString("hr-HR");
    if (content.includes("Zadnje ažuriranje:")) {
      content = content.replace(/\/\/ Zadnje ažuriranje:[^\n]*/, `// Zadnje ažuriranje: ${dateStr} (admin)`);
    } else {
      content = content.replace(
        "// ⚠️  CIJENE SE MIJENJAJU SVAKI TJEDAN",
        `// ⚠️  CIJENE SE MIJENJAJU SVAKI TJEDAN\n// Zadnje ažuriranje: ${dateStr} (admin)`
      );
    }

    // Commit to GitHub
    const encoded = Buffer.from(content, "utf-8").toString("base64");
    const commitRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/lib/constants.ts`,
      {
        method: "PUT",
        headers: getGithubHeaders(),
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
      throw new Error(`GitHub commit: ${commitRes.status} — ${errText}`);
    }

    const commitData = await commitRes.json();
    return NextResponse.json({
      success: true,
      commitUrl: commitData.commit?.html_url,
      message: `Cijene ažurirane i commitane na GitHub. Vercel deployuje za ~2 minute.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
