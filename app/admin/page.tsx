"use client";
import { useState, useEffect, useCallback } from "react";

const S = {
  bg: "#0F0F1E", card: "#1A1A2E", card2: "#202038", border: "#30304E",
  text: "#E0E0F8", muted: "#7878A8", gold: "#FFD700", white: "#F4F4FF",
  red: "#E8002D", ok: "#4ADE80", warn: "#FF8000", silver: "#A0A0C8",
};

interface DriverPrice  { shortName: string; name: string; price: number }
interface ConstrPrice  { id: string; name: string; price: number }

export default function AdminPage() {
  const [password, setPassword]     = useState("");
  const [authed, setAuthed]         = useState(false);
  const [drivers, setDrivers]       = useState<DriverPrice[]>([]);
  const [constrs, setConstrs]       = useState<ConstrPrice[]>([]);
  const [sha, setSha]               = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [changed, setChanged]       = useState(false);

  const load = useCallback(async (pass: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/prices?password=${encodeURIComponent(pass)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDrivers(data.drivers);
      setConstrs(data.constructors);
      setSha(data.sha);
      setLastUpdated(data.lastUpdated ?? "—");
      setAuthed(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, drivers, constructors: constrs, sha }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.message);
      setChanged(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateDriver = (i: number, price: number) => {
    const next = [...drivers]; next[i] = { ...next[i], price };
    setDrivers(next); setChanged(true);
  };
  const updateConstr = (i: number, price: number) => {
    const next = [...constrs]; next[i] = { ...next[i], price };
    setConstrs(next); setChanged(true);
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:S.bg, display:"flex",
        alignItems:"center", justifyContent:"center", fontFamily:"'Courier New',monospace" }}>
        <div style={{ background:S.card, border:`1px solid ${S.border}`,
          borderRadius:8, padding:"40px 48px", width:340, textAlign:"center" }}>
          <div style={{ fontSize:11, letterSpacing:"0.3em", color:S.muted, marginBottom:8 }}>F1 FANTASY PREDICTOR</div>
          <div style={{ fontSize:20, fontWeight:900, color:S.white, marginBottom:4 }}>ADMIN</div>
          <div style={{ fontSize:13, color:S.muted, marginBottom:28 }}>Ažuriranje cijena vozača i timova</div>

          <input
            type="password"
            placeholder="Admin lozinka"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(password)}
            style={{ width:"100%", padding:"10px 14px", background:S.card2,
              border:`1px solid ${S.border}`, borderRadius:4, color:S.white,
              fontFamily:"monospace", fontSize:14, marginBottom:12, boxSizing:"border-box" }}
          />
          {error && <div style={{ color:S.red, fontSize:12, marginBottom:10 }}>{error}</div>}
          <button onClick={() => load(password)} disabled={loading || !password}
            style={{ width:"100%", padding:"11px", background: password ? S.red : S.border,
              border:"none", borderRadius:4, color:"#fff", fontSize:13, fontWeight:900,
              cursor: password ? "pointer" : "default", letterSpacing:"0.1em" }}>
            {loading ? "UČITAVANJE..." : "PRIJAVA →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ─────────────────────────────────────────────────────────
  const PriceRow = ({ label, price, onChange }: { label:string; price:number; onChange:(v:number)=>void }) => {
    const [val, setVal] = useState(price.toFixed(1));
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0",
        borderBottom:`1px solid ${S.border}` }}>
        <span style={{ flex:1, fontSize:13, color:S.text }}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:12, color:S.muted }}>$</span>
          <input
            type="number" step="0.1" min="1" max="50"
            value={focused ? val : price.toFixed(1)}
            onFocus={() => { setVal(price.toFixed(1)); setFocused(true); }}
            onBlur={() => { setFocused(false); const n=parseFloat(val); if(!isNaN(n)) onChange(n); }}
            onChange={e => setVal(e.target.value)}
            style={{ width:60, padding:"4px 8px", background:S.card2, border:`1px solid ${S.border}`,
              borderRadius:3, color:S.gold, fontFamily:"monospace", fontSize:13,
              textAlign:"right" }}
          />
          <span style={{ fontSize:12, color:S.muted }}>M</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:S.text,
      fontFamily:"'Courier New',monospace", padding:"24px 16px" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, letterSpacing:"0.3em", color:S.muted }}>F1 FANTASY PREDICTOR</div>
            <div style={{ fontSize:22, fontWeight:900, color:S.white }}>ADMIN — CIJENE</div>
            {lastUpdated && (
              <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>
                Zadnje ažuriranje: {lastUpdated}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setAuthed(false); setPassword(""); }}
              style={{ padding:"8px 16px", background:"transparent", border:`1px solid ${S.border}`,
                borderRadius:4, color:S.muted, cursor:"pointer", fontFamily:"monospace", fontSize:12 }}>
              ODJAVA
            </button>
            <button onClick={save} disabled={saving || !changed}
              style={{ padding:"8px 20px",
                background: changed ? S.ok : S.border,
                border:"none", borderRadius:4,
                color: changed ? "#000" : S.muted,
                cursor: changed ? "pointer" : "default",
                fontFamily:"monospace", fontSize:13, fontWeight:900 }}>
              {saving ? "SPREMA..." : "💾 SPREMI I DEPLOYAJ"}
            </button>
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <div style={{ background:S.red+"18", border:`1px solid ${S.red}50`,
            borderRadius:4, padding:"10px 16px", marginBottom:16, fontSize:13, color:S.red }}>
            ❌ {error}
          </div>
        )}
        {success && (
          <div style={{ background:S.ok+"18", border:`1px solid ${S.ok}50`,
            borderRadius:4, padding:"10px 16px", marginBottom:16, fontSize:13, color:S.ok }}>
            ✅ {success}
            <div style={{ fontSize:11, color:S.muted, marginTop:4 }}>
              Vercel deployuje automatski za ~2 minute. Osvježi stranicu da vidiš nove cijene.
            </div>
          </div>
        )}

        {changed && (
          <div style={{ background:S.warn+"18", border:`1px solid ${S.warn}50`,
            borderRadius:4, padding:"8px 14px", marginBottom:16, fontSize:12, color:S.warn }}>
            ⚠️ Nepohranjena promjena — klikni "Spremi i Deployaj" da aktiviraš nove cijene.
          </div>
        )}

        {/* Info box */}
        <div style={{ background:S.card2, border:`1px solid ${S.border}`,
          borderRadius:4, padding:"12px 16px", marginBottom:20, fontSize:12, color:S.muted, lineHeight:1.7 }}>
          <strong style={{ color:S.silver }}>Upute:</strong> Unesi aktualne cijene iz F1 Fantasy appa (Settings → My Team → svaki vozač). 
          Klikni "Spremi i Deployaj" — promjene se commitaju na GitHub i Vercel automatski deploya.
          Nova verzija aplikacije dostupna je za ~2 minute.
        </div>

        {/* Two columns */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Drivers */}
          <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:6, padding:16 }}>
            <div style={{ fontSize:10, letterSpacing:"0.2em", color:S.muted, marginBottom:12 }}>VOZAČI (22)</div>
            {drivers.map((d, i) => (
              <PriceRow key={d.shortName}
                label={`${d.shortName} — ${d.name}`}
                price={d.price}
                onChange={v => updateDriver(i, v)}
              />
            ))}
          </div>

          {/* Constructors */}
          <div>
            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:6, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:"0.2em", color:S.muted, marginBottom:12 }}>KONSTRUKTORI (11)</div>
              {constrs.map((c, i) => (
                <PriceRow key={c.id}
                  label={c.name}
                  price={c.price}
                  onChange={v => updateConstr(i, v)}
                />
              ))}
            </div>

            {/* Quick reference */}
            <div style={{ background:S.card, border:`1px solid ${S.border}`, borderRadius:6, padding:16 }}>
              <div style={{ fontSize:10, letterSpacing:"0.2em", color:S.muted, marginBottom:10 }}>BRZA NAPOMENA</div>
              <div style={{ fontSize:11, color:S.muted, lineHeight:1.8 }}>
                📱 F1 Fantasy app → Fantasy → My Team<br/>
                → klikni na vozača → vidi cijenu<br/>
                🗓️ Cijene se mijenjaju svakog <strong style={{color:S.silver}}>četvrtka</strong> u tjednu utrke.<br/>
                🔄 Nakon spremi, Vercel deploya za ~2 min.<br/>
                🔗 Status deploymenta: <a href="https://vercel.com" target="_blank"
                  style={{ color:"#5AB4FF" }}>vercel.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
