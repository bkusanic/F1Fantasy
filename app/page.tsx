"use client";
import React, { useState } from "react";
import { DRIVERS_2025, CONSTRUCTORS_2025, TRACKS_2025, CHIPS, TEAM_COLORS } from "@/lib/constants";
import type { Track, Driver, Constructor } from "@/lib/types";

const tc = (id: string) => TEAM_COLORS[id] ?? "#888";

const S = {
  bg:     "#0F0F1E",   // lighter dark navy (was #050508)
  card:   "#1A1A2E",   // lighter card (was #0D0D18)
  card2:  "#202038",   // lighter secondary card
  border: "#30304E",   // more visible border
  red:    "#E8002D",
  gold:   "#FFD700",
  white:  "#F4F4FF",   // slightly warmer white
  silver: "#A0A0C8",   // brighter silver
  blue:   "#5AB4FF",   // slightly lighter blue
  muted:  "#7878A8",   // much brighter muted (was #505068 — too dark)
  text:   "#E0E0F8",   // brighter body text
  ok:     "#5AB4FF",
  warn:   "#FFD700",
  err:    "#FF7070",
};

// ─── Team Themes ──────────────────────────────────────────────────────────────
const TEAM_THEMES: Record<string, {
  primary: string; bg: string; card: string; card2: string;
  border: string; name: string; emoji: string;
  gradient: string;          // full page background gradient
  headerGradient: string;    // header background
  glowColor: string;         // card shadow glow
  textOnPrimary: string;     // text color on colored backgrounds
  mark: string;              // SVG path for abstract team mark
  markViewBox: string;
}> = {
  mclaren: {
    primary:"#FF8000", bg:"#090501", card:"rgba(12,8,0,0.88)", card2:"rgba(20,12,0,0.92)",
    border:"#FF800055", name:"McLaren", emoji:"🟠",
    gradient:"linear-gradient(150deg, #FF800075 0%, #FF800022 30%, #FF800008 50%, #090501 70%)",
    headerGradient:"linear-gradient(90deg, #FF8000EE 0%, #FF8000AA 50%, #0A0601 100%)",
    glowColor:"#FF800030", textOnPrimary:"#000000",
    mark:`<path d="M4,22 L18,4 L56,4 L56,22 L42,40 L4,40 Z" fill="#FF8000" opacity="0.9"/>
          <path d="M8,22 L20,8 L52,8 L52,22 L40,36 L8,36 Z" fill="none" stroke="#000" stroke-width="1.5"/>`,
    markViewBox:"0 0 60 44",
  },
  mercedes: {
    primary:"#00D2BE", bg:"#000A09", card:"rgba(0,14,12,0.88)", card2:"rgba(0,18,16,0.92)",
    border:"#00D2BE55", name:"Mercedes", emoji:"🩵",
    gradient:"radial-gradient(ellipse 90% 60% at 50% 0%, #00D2BE65 0%, #00D2BE15 35%, #00D2BE05 55%, #000A09 75%)",
    headerGradient:"linear-gradient(90deg, #00D2BEEE 0%, #00D2BE99 50%, #000D0C 100%)",
    glowColor:"#00D2BE30", textOnPrimary:"#000000",
    mark:`<polygon points="30,3 57,50 3,50" fill="none" stroke="#00D2BE" stroke-width="3"/>
          <polygon points="30,14 48,44 12,44" fill="#00D2BE" opacity="0.4"/>
          <circle cx="30" cy="30" r="5" fill="#00D2BE"/>`,
    markViewBox:"0 0 60 54",
  },
  ferrari: {
    primary:"#E8002D", bg:"#090001", card:"rgba(14,0,3,0.88)", card2:"rgba(20,0,5,0.92)",
    border:"#E8002D55", name:"Ferrari", emoji:"🔴",
    gradient:"radial-gradient(ellipse 70% 80% at 0% 0%, #E8002D70 0%, #E8002D18 35%, #E8002D05 55%, #090001 72%)",
    headerGradient:"linear-gradient(90deg, #E8002DEE 0%, #E8002DAA 50%, #0A0002 100%)",
    glowColor:"#E8002D30", textOnPrimary:"#FFFFFF",
    mark:`<rect x="4" y="4" width="22" height="52" rx="2" fill="#E8002D"/>
          <rect x="34" y="4" width="22" height="52" rx="2" fill="#FFD700"/>
          <path d="M14,20 Q26,12 40,20 Q52,28 40,38 Q28,48 14,38 Z" fill="#000" opacity="0.2"/>`,
    markViewBox:"0 0 60 60",
  },
  redbull: {
    primary:"#3671C6", bg:"#00040E", card:"rgba(0,6,18,0.88)", card2:"rgba(0,8,24,0.92)",
    border:"#3671C655", name:"Red Bull", emoji:"🔵",
    gradient:"linear-gradient(135deg, #3671C655 0%, #CC111122 20%, #3671C618 40%, #00040E 65%)",
    headerGradient:"linear-gradient(90deg, #3671C6EE 0%, #CC1111AA 35%, #3671C699 65%, #000510 100%)",
    glowColor:"#3671C630", textOnPrimary:"#FFFFFF",
    mark:`<path d="M8,30 Q8,8 30,8 Q52,8 52,20 Q52,30 38,32 L52,52 L38,52 L26,34 L18,34 L18,52 L8,52 Z" fill="#3671C6"/>
          <path d="M18,16 L18,28 L30,28 Q38,28 38,22 Q38,16 30,16 Z" fill="#CC1111"/>`,
    markViewBox:"0 0 60 60",
  },
  williams: {
    primary:"#00A3E0", bg:"#00060A", card:"rgba(0,8,14,0.88)", card2:"rgba(0,10,18,0.92)",
    border:"#00A3E055", name:"Williams", emoji:"🔷",
    gradient:"linear-gradient(160deg, #00A3E050 0%, #00A3E018 35%, #00A3E006 52%, #00060A 70%)",
    headerGradient:"linear-gradient(90deg, #003399EE 0%, #00A3E0AA 50%, #000610 100%)",
    glowColor:"#00A3E030", textOnPrimary:"#FFFFFF",
    mark:`<path d="M4,8 L16,52 L30,22 L44,52 L56,8 L46,8 L36,38 L30,18 L24,38 L14,8 Z" fill="#00A3E0"/>`,
    markViewBox:"0 0 60 60",
  },
  rb: {
    primary:"#6692FF", bg:"#00030E", card:"rgba(0,4,18,0.88)", card2:"rgba(0,6,22,0.92)",
    border:"#6692FF55", name:"Racing Bulls", emoji:"💙",
    gradient:"radial-gradient(ellipse 80% 60% at 100% 0%, #6692FF45 0%, #6692FF12 40%, #00030E 65%)",
    headerGradient:"linear-gradient(90deg, #1A2FEE 0%, #6692FFCC 50%, #000410 100%)",
    glowColor:"#6692FF30", textOnPrimary:"#FFFFFF",
    mark:`<path d="M4,30 Q4,6 22,6 Q36,6 40,18 Q44,6 56,6 L56,30 Q56,54 30,54 Q4,54 4,30 Z" fill="#6692FF" opacity="0.8"/>
          <path d="M14,30 Q14,16 22,14 Q30,12 34,20" fill="none" stroke="#fff" stroke-width="2"/>`,
    markViewBox:"0 0 60 60",
  },
  aston: {
    primary:"#229971", bg:"#000A06", card:"rgba(0,12,8,0.88)", card2:"rgba(0,16,10,0.92)",
    border:"#22997155", name:"Aston Martin", emoji:"🟢",
    gradient:"linear-gradient(145deg, #22997150 0%, #22997118 35%, #22997106 52%, #000A06 70%)",
    headerGradient:"linear-gradient(90deg, #006B4FEE 0%, #229971AA 50%, #000B07 100%)",
    glowColor:"#22997130", textOnPrimary:"#FFFFFF",
    mark:`<path d="M4,52 L30,8 L56,52 Z" fill="none" stroke="#229971" stroke-width="4"/>
          <path d="M14,52 L30,22 L46,52 Z" fill="#229971" opacity="0.6"/>
          <path d="M22,52 L30,36 L38,52 Z" fill="#229971"/>`,
    markViewBox:"0 0 60 60",
  },
  haas: {
    primary:"#C8CCCE", bg:"#060608", card:"rgba(10,10,12,0.92)", card2:"rgba(14,14,16,0.94)",
    border:"#C8CCCE55", name:"Haas", emoji:"⚪",
    gradient:"linear-gradient(135deg, #C8CCCE30 0%, #C8CCCE10 30%, #C8CCCE04 50%, #060608 70%)",
    headerGradient:"linear-gradient(90deg, #555555EE 0%, #C8CCCEAA 50%, #060608 100%)",
    glowColor:"#C8CCCE25", textOnPrimary:"#000000",
    mark:`<rect x="4" y="22" width="52" height="16" rx="3" fill="#C8CCCE"/>
          <rect x="4" y="4" width="22" height="16" rx="3" fill="#C8CCCE"/>
          <rect x="34" y="4" width="22" height="16" rx="3" fill="#E8002D"/>`,
    markViewBox:"0 0 60 60",
  },
  audi: {
    primary:"#C0B8D4", bg:"#060608", card:"rgba(10,10,12,0.92)", card2:"rgba(14,14,16,0.94)",
    border:"#C0B8D455", name:"Audi", emoji:"⚪",
    gradient:"linear-gradient(160deg, #C0B8D425 0%, #C0B8D408 40%, #060608 65%)",
    headerGradient:"linear-gradient(90deg, #444444EE 0%, #C0B8D4AA 50%, #060608 100%)",
    glowColor:"#C0B8D425", textOnPrimary:"#000000",
    mark:`<circle cx="14" cy="30" r="10" fill="none" stroke="#C0B8D4" stroke-width="3"/>
          <circle cx="30" cy="30" r="10" fill="none" stroke="#C0B8D4" stroke-width="3"/>
          <circle cx="46" cy="30" r="10" fill="none" stroke="#C0B8D4" stroke-width="3"/>`,
    markViewBox:"0 0 60 60",
  },
  alpine: {
    primary:"#FF87BC", bg:"#090005", card:"rgba(14,0,8,0.88)", card2:"rgba(18,0,10,0.92)",
    border:"#FF87BC55", name:"Alpine", emoji:"🩷",
    gradient:"radial-gradient(ellipse 80% 60% at 100% 100%, #0033AA40 0%, #0033AA10 30%, #090005 55%), radial-gradient(ellipse 60% 50% at 0% 0%, #FF87BC40 0%, #FF87BC10 35%, #090005 60%)",
    headerGradient:"linear-gradient(90deg, #0033AAEE 0%, #FF87BCAA 65%, #09000A 100%)",
    glowColor:"#FF87BC28", textOnPrimary:"#000000",
    mark:`<path d="M30,4 L42,28 L56,28 L45,42 L50,56 L30,46 L10,56 L15,42 L4,28 L18,28 Z" fill="none" stroke="#FF87BC" stroke-width="2.5"/>
          <path d="M30,14 L38,28 L48,28 L40,37 L43,48 L30,41 L17,48 L20,37 L12,28 L22,28 Z" fill="#0033AA" opacity="0.6"/>`,
    markViewBox:"0 0 60 60",
  },
  cadillac: {
    primary:"#4A8FD4", bg:"#00040C", card:"rgba(0,6,16,0.88)", card2:"rgba(0,8,20,0.92)",
    border:"#4A8FD455", name:"Cadillac", emoji:"🌀",
    gradient:"radial-gradient(ellipse 70% 55% at 50% 0%, #4A8FD448 0%, #4A8FD415 38%, #4A8FD406 55%, #00040C 72%)",
    headerGradient:"linear-gradient(90deg, #003388EE 0%, #4A8FD4AA 50%, #000410 100%)",
    glowColor:"#4A8FD430", textOnPrimary:"#FFFFFF",
    mark:`<path d="M4,20 L20,4 L40,4 L56,20 L56,40 L40,56 L20,56 L4,40 Z" fill="none" stroke="#4A8FD4" stroke-width="3"/>
          <path d="M14,24 L24,14 L36,14 L46,24 L46,36 L36,46 L24,46 L14,36 Z" fill="#4A8FD4" opacity="0.35"/>
          <path d="M22,30 L30,22 L38,30 L30,38 Z" fill="#4A8FD4"/>`,
    markViewBox:"0 0 60 60",
  },
};

type TTheme = typeof S & {
  gradient: string; headerGradient: string; glowColor: string;
  textOnPrimary: string; mark: string; markViewBox: string; teamName: string;
};
function getTheme(teamId: string): TTheme {
  const t = TEAM_THEMES[teamId] ?? TEAM_THEMES.ferrari;
  return {
    ...S,
    red: t.primary, bg: t.bg, card: t.card, card2: t.card2,
    border: t.border, ok: t.primary,
    gradient: t.gradient,
    headerGradient: t.headerGradient,
    glowColor: t.glowColor,
    textOnPrimary: t.textOnPrimary,
    mark: t.mark,
    markViewBox: t.markViewBox,
    teamName: t.name,
  };
}

function TeamPicker({ onSelect }: { onSelect:(id:string)=>void }) {
  const [hovered, setHovered] = React.useState<string|null>(null);
  const hTheme = hovered ? TEAM_THEMES[hovered] : null;
  return (
    <div style={{ minHeight:"100vh", background:"#030306",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 16px", fontFamily:"'Courier New', monospace",
      position:"relative", overflow:"hidden" }}>
      {/* Background reacts to hover */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background: hTheme ? hTheme.gradient : "radial-gradient(ellipse 80% 50% at 50% 0%, #E8002D15, #030306)",
        transition:"background 0.5s ease",
      }} />
      <div style={{ width:"100%", maxWidth:680, position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize: 11, letterSpacing:"0.4em", color:"#505068", marginBottom:10 }}>
            OFFICIAL F1 FANTASY 2026
          </div>
          <div style={{ fontSize: 32, fontWeight:900, color:"#FFFFFF",
            letterSpacing:"0.06em", lineHeight:1, textShadow:"0 0 30px rgba(255,255,255,0.2)" }}>
            PREDICTOR
          </div>
          <div style={{ marginTop:14, fontSize: 15, color:"#8888AA" }}>Za koji tim navijaš?</div>
          <div style={{ fontSize: 12, color:"#404058", marginTop:4 }}>Odabir primjenjuje vizualnu temu tima</div>
        </div>
        {/* Team grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
          {Object.entries(TEAM_THEMES).map(([id, t]) => {
            const isHovered = hovered === id;
            return (
              <div key={id}
                onClick={()=>onSelect(id)}
                onMouseEnter={()=>setHovered(id)}
                onMouseLeave={()=>setHovered(null)}
                style={{
                  background: isHovered ? t.card : "rgba(8,8,16,0.95)",
                  border:`2px solid ${isHovered ? t.primary : "#1A1A2E"}`,
                  borderRadius:6, padding:"16px 14px", cursor:"pointer",
                  transition:"all 0.25s ease",
                  boxShadow: isHovered ? `0 0 28px ${t.glowColor}, 0 0 8px ${t.glowColor}` : "none",
                  position:"relative", overflow:"hidden",
                }}>
                {/* Abstract team mark in corner */}
                <div style={{ position:"absolute", top:-4, right:-4,
                  opacity: isHovered ? 0.22 : 0.08, transition:"opacity 0.3s",
                  width:64, height:64, pointerEvents:"none" }}>
                  <svg viewBox={t.markViewBox} width="100%" height="100%"
                    dangerouslySetInnerHTML={{ __html: t.mark }} />
                </div>
                {/* Top color stripe */}
                <div style={{ height:3, marginBottom:12,
                  background:`linear-gradient(90deg, ${t.primary} 0%, ${t.primary}33 100%)`,
                  borderRadius:2 }} />
                {/* Team name */}
                <div style={{ fontSize: 13, fontWeight:900,
                  color: isHovered ? t.primary : "#B0B0CC",
                  letterSpacing:"0.08em", transition:"color 0.2s", marginBottom:8 }}>
                  {t.name.toUpperCase()}
                </div>
                {/* Color dot + hex */}
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%",
                    background:t.primary, boxShadow: isHovered ? `0 0 8px ${t.primary}` : "none",
                    transition:"box-shadow 0.2s", flexShrink:0 }} />
                  <div style={{ fontSize: 10, color:"#404058", fontFamily:"monospace" }}>{t.primary}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Pill = ({ children, color = S.red, icon }: { children: React.ReactNode; color?: string; icon?: string }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}66`,
    padding: "2px 8px", borderRadius: 2, fontSize: 12,
    fontFamily: "monospace", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3,
  }}>{icon && <span>{icon}</span>}{children}</span>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <div style={{ width: 3, height: 14, background: S.red, borderRadius: 1 }} />
    <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: S.silver, fontWeight: 700 }}>
      {children}
    </span>
  </div>
);

const StatusBadge = ({ ok, okLabel, failLabel }: { ok: boolean; okLabel: string; failLabel: string }) => (
  <span style={{
    background: ok ? S.ok + "22" : S.warn + "22",
    border: `2px solid ${ok ? S.ok : S.warn}`,
    color: ok ? S.ok : S.warn,
    padding: "2px 9px", borderRadius: 3, fontSize: 12, fontWeight: 700,
    fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 5,
  }}>
    <span>{ok ? "✓" : "!"}</span><span>{ok ? okLabel : failLabel}</span>
  </span>
);

// ─── Driver Card ──────────────────────────────────────────────────────────────
function DriverCard({ driver: d, selected, isCaptain, onToggle, onSetCaptain }: {
  driver: Driver; selected: boolean; isCaptain: boolean;
  onToggle: () => void; onSetCaptain: () => void;
}) {
  const color = tc(d.team);
  return (
    <div onClick={onToggle} style={{
      position: "relative", cursor: "pointer",
      background: selected ? S.card2 : S.card,
      borderTop: `2px solid ${selected ? S.white : S.border}`, borderRight: `2px solid ${selected ? S.white : S.border}`, borderBottom: `2px solid ${selected ? S.white : S.border}`,
      borderLeft: `5px solid ${color}`,
      borderRadius: 3, padding: "10px 12px", transition: "border-color 0.15s",
      opacity: selected ? 1 : 0.5,
    }}>
      {isCaptain && (
        <div style={{ position: "absolute", top: 0, right: 0, background: S.red,
          fontSize: 10, color: "#fff", padding: "2px 6px", borderRadius: "0 3px 0 3px",
          fontWeight: 900, letterSpacing: "0.08em" }}>⚡ DRS</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: selected ? S.white : S.silver, letterSpacing: "0.06em" }}>
            {d.shortName}
          </div>
          <div style={{ fontSize: 10, color: S.muted, marginTop: 1 }}>#{d.driverNumber} · {d.name.split(" ").slice(-1)[0]}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: selected ? S.gold : S.muted, fontFamily: "monospace" }}>
          ${d.price}M
        </div>
      </div>
      <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, letterSpacing: "0.1em", color, fontWeight: 700 }}>{d.team.toUpperCase()}</span>
        {selected && (
          <button onClick={e => { e.stopPropagation(); onSetCaptain(); }} style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 2, cursor: "pointer",
            background: isCaptain ? S.red : "transparent",
            border: `1px solid ${isCaptain ? S.red : S.border}`,
            color: isCaptain ? "#fff" : S.muted,
            fontFamily: "monospace", fontWeight: 700,
          }}>{isCaptain ? "✓ DRS 2×" : "DRS 2×"}</button>
        )}
      </div>
    </div>
  );
}

function ConstructorCard({ constructor: c, selected, onToggle }: {
  constructor: Constructor; selected: boolean; onToggle: () => void;
}) {
  const color = tc(c.id);
  return (
    <div onClick={onToggle} style={{
      cursor: "pointer", background: selected ? S.card2 : S.card,
      borderTop: `2px solid ${selected ? S.white : S.border}`, borderRight: `2px solid ${selected ? S.white : S.border}`, borderBottom: `2px solid ${selected ? S.white : S.border}`,
      borderLeft: `5px solid ${color}`,
      borderRadius: 3, padding: "11px 13px", transition: "border-color 0.15s",
      opacity: selected ? 1 : 0.5,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: selected ? S.white : S.silver }}>{c.shortName}</div>
          <div style={{ fontSize: 11, color: S.muted }}>{c.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: selected ? S.gold : S.muted, fontFamily: "monospace" }}>
            ${c.price}M
          </div>
          {selected && <div style={{ fontSize: 10, color: S.ok, fontWeight: 700 }}>✓ ODABRANO</div>}
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
interface AppState {
  mode: "existing" | "fresh";
  favoriteTeam: string;
  drivers: string[];
  constructors: string[];
  captain: string;
  usedChips: string[];
  freeTransfers: number;
  remainingBudget: number;
  totalBudget: number;
  track: Track;
}

function Onboarding({ onFinish }: { onFinish: (s: AppState) => void }) {
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [mode, setMode] = useState<"existing" | "fresh" | null>(null);
  const [step, setStep] = useState(0);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [constructors, setConstructors] = useState<string[]>([]);
  const [captain, setCaptain] = useState("");
  const [usedChips, setUsedChips] = useState<string[]>([]);
  const [freeTransfers, setFreeTransfers] = useState(2);
  const [remainingBudget, setRemainingBudget] = useState(2.0);
  const [totalBudget, setTotalBudget] = useState(100.0);
  const nextTrack = TRACKS_2025.find(t => t.date >= new Date().toISOString().slice(0, 10)) ?? TRACKS_2025[4];
  const [track, setTrack] = useState<Track>(nextTrack);

  const teamGroups = CONSTRUCTORS_2025.map(c => ({
    constructor: c, drivers: DRIVERS_2025.filter(d => d.team === c.id),
  }));

  // Steps differ by mode
  const existingSteps = [
    { title: "Koji vozači su ti u timu?",  sub: `${drivers.length}/5 odabrano` },
    { title: "Koji konstruktori?",         sub: `${constructors.length}/2 odabrano` },
    { title: "DRS Boost vozač",            sub: "Koga 2× boostas ovaj vikend?" },
    { title: "Budžet i transferi",         sub: "Preostali budžet iz F1 Fantasy appa" },
    { title: "Chipovi",                    sub: "Koji su iskorišteni ove sezone?" },
    { title: "Odaberi utrku",              sub: "Za koju utrku predviđamo?" },
  ];
  const freshSteps = [
    { title: "Ukupni budžet",   sub: "Koliko imaš na raspolaganju? (default: $100M)" },
    { title: "Odaberi utrku",   sub: "Za koju utrku gradimo tim?" },
    { title: "Iskorišteni chipovi", sub: "Ako već imaš account — koji chipovi su potrošeni?" },
  ];

  const steps = mode === "fresh" ? freshSteps : existingSteps;
  const canNext = mode === "existing"
    ? [drivers.length === 5, constructors.length === 2, !!captain, true, true, true][step]
    : true;

  // Mode not chosen yet — show picker
  if (!favoriteTeam) return <TeamPicker onSelect={setFavoriteTeam} />;

  const T = getTheme(favoriteTeam);

  if (!mode) {
    return (
      <div style={{ minHeight: "100vh",
        background: T.gradient, backgroundAttachment: "fixed",
        display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px 16px", fontFamily: "'Courier New', monospace" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-block", background: S.red, padding: "5px 12px",
              borderRadius: 3, marginBottom: 12 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.25em", color: "#fff", fontWeight: 900 }}>F1 FANTASY 2026</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: S.white, letterSpacing: "0.04em" }}>PREDICTOR</div>
            <div style={{ fontSize: 13, color: S.muted, marginTop: 6 }}>AI asistent za optimizaciju tima</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Existing team */}
            <div onClick={() => { setMode("existing"); setStep(0); }} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
              padding: "22px 24px", cursor: "pointer", transition: "all 0.2s",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = S.white)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = S.border)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 32 }}>🏎️</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: S.white, marginBottom: 4 }}>
                    Imam postojeći tim
                  </div>
                  <div style={{ fontSize: 13, color: S.silver, lineHeight: 1.6 }}>
                    Uneseš vozače i konstruktore iz svog F1 Fantasy tima.<br />
                    App predlaže optimalne izmjene i DRS Boost za sljedeću utrku.
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 20, color: S.muted }}>→</div>
              </div>
            </div>

            {/* Fresh start */}
            <div onClick={() => { setMode("fresh"); setStep(0); }} style={{
              background: S.card, border: `2px solid ${S.border}`, borderRadius: 4,
              padding: "22px 24px", cursor: "pointer", transition: "border-color 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = S.gold)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = S.border)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 32 }}>🆕</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: S.white, marginBottom: 4 }}>
                    Počinjem od nule
                    <span style={{ background: S.gold + "22", border: `1px solid ${S.gold}44`,
                      color: S.gold, fontSize: 11, padding: "2px 7px", borderRadius: 2,
                      marginLeft: 8, fontWeight: 900 }}>NOVO</span>
                  </div>
                  <div style={{ fontSize: 13, color: S.silver, lineHeight: 1.6 }}>
                    Još nemaš tim ili želiš posložiti sve ispočetka.<br />
                    App predloži optimalan tim unutar budžeta od $100M.
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 20, color: S.muted }}>→</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const finish = () => onFinish({
    mode: mode!,
    favoriteTeam: favoriteTeam!,
    drivers, constructors, captain,
    usedChips, freeTransfers,
    remainingBudget: mode === "fresh" ? totalBudget : remainingBudget,
    totalBudget,
    track,
  });

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "20px 16px", fontFamily: "'Courier New', monospace" }}>
      <div style={{ width: "100%", maxWidth: 700 }}>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => step === 0 ? setMode(null) : setStep(s => s - 1)} style={{
            background: "none", border: `1px solid ${S.border}`, borderRadius: 2,
            color: S.muted, padding: "3px 10px", cursor: "pointer",
            fontSize: 11, fontFamily: "monospace",
          }}>← NATRAG</button>
          <div style={{ flex: 1, height: 3, background: S.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((step + 1) / steps.length) * 100}%`,
              background: `linear-gradient(90deg, ${T.red}, ${S.gold})`,
              transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 11, color: S.muted, fontFamily: "monospace", whiteSpace: "nowrap" }}>
            {step + 1} / {steps.length}
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
          overflow: "hidden", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: `0 20px 60px #00000060, 0 0 40px ${T.glowColor}` }}>
          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`,
            background: T.card2, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${T.red}, ${S.gold})` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: S.white }}>{steps[step].title}</div>
              {mode === "fresh" && (
                <span style={{ background: S.gold + "22", border: `1px solid ${S.gold}44`,
                  color: S.gold, fontSize: 10, padding: "2px 7px", borderRadius: 2, fontWeight: 900 }}>
                  NOVI TIM
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: S.silver }}>{steps[step].sub}</div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px", maxHeight: "62vh", overflowY: "auto" }}>

            {/* ─── FRESH STEPS ─── */}
            {mode === "fresh" && step === 0 && (
              <div>
                <div style={{ background: S.card2, border: `2px solid ${S.gold}44`,
                  borderRadius: 4, padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.18em", color: S.gold, marginBottom: 12, fontWeight: 700 }}>
                    💰 RASPOLOŽIVI BUDŽET
                  </div>
                  <p style={{ fontSize: 13, color: S.silver, lineHeight: 1.7, margin: "0 0 16px" }}>
                    Official F1 Fantasy daje svim igračima početni budžet od{" "}
                    <strong style={{ color: S.white }}>$100M</strong>. Ako imaš drukčiji iznos
                    (npr. ako si već odigrao koji vikend), unesi stvarni iznos.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: S.gold, fontSize: 20, fontWeight: 900 }}>$</span>
                    <input type="number" step="0.5" min="50" max="110"
                      value={totalBudget}
                      onChange={e => setTotalBudget(parseFloat(e.target.value) || 100)}
                      style={{ background: S.card, border: `2px solid ${S.gold}66`,
                        color: S.gold, padding: "12px 14px", borderRadius: 3,
                        fontSize: 28, fontWeight: 900, fontFamily: "monospace",
                        width: 130, outline: "none", textAlign: "center" }}
                    />
                    <span style={{ color: S.gold, fontSize: 20, fontWeight: 900 }}>M</span>
                  </div>
                </div>
                <div style={{ background: S.card2, border: `1px solid ${S.border}`,
                  borderRadius: 3, padding: "12px 16px", fontSize: 13, color: S.silver, lineHeight: 1.7 }}>
                  💡 Claude će izabrati optimalni tim od 5 vozača + 2 konstruktora koji
                  maksimizira očekivane bodove za odabranu utrku, unutar ovog budžeta.
                </div>
              </div>
            )}

            {mode === "fresh" && step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {TRACKS_2025.map(t => {
                  const isPast = t.date < new Date().toISOString().slice(0, 10);
                  const isSelected = track.id === t.id;
                  return (
                    <div key={t.id} onClick={() => !isPast && setTrack(t)} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      cursor: isPast ? "default" : "pointer",
                      background: isSelected ? S.card2 : S.card,
                      border: `2px solid ${isSelected ? S.white : S.border}`,
                      borderRadius: 3, padding: "10px 14px",
                      opacity: isPast ? 0.3 : 1, transition: "border-color 0.15s",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: S.gold,
                        fontFamily: "monospace", minWidth: 22 }}>R{t.round}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? S.white : S.text }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 10, color: S.muted }}>{t.date} · {t.country}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.isSprint && <Pill color="#FF8000" icon="⚡">SPRINT</Pill>}
                        {t.circuitType === "street" && <Pill color={S.blue} icon="🏙">STREET</Pill>}
                        {isSelected && <Pill color={S.gold} icon="✓">ODABRANO</Pill>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {mode === "fresh" && step === 2 && (
              <div>
                <div style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 3,
                  padding: "10px 14px", marginBottom: 14, fontSize: 13, color: S.silver }}>
                  💡 Ako tek počinješ, preskoči ovaj korak — svi chipovi su ti dostupni.
                  Klikni chipove koje si već iskoristio samo ako imaš postojeći account.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {CHIPS.map(chip => {
                    const used = usedChips.includes(chip.id);
                    return (
                      <div key={chip.id} title={chip.desc}
                        onClick={() => setUsedChips(prev =>
                          prev.includes(chip.id) ? prev.filter(c => c !== chip.id) : [...prev, chip.id]
                        )}
                        style={{
                          background: used ? S.card : S.card2,
                          border: `2px solid ${used ? S.border : S.blue}`,
                          borderRadius: 3, padding: "14px 8px", cursor: "pointer",
                          textAlign: "center", opacity: used ? 0.35 : 1,
                        }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{chip.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 900,
                          color: used ? S.muted : S.blue }}>{chip.label}</div>
                        <div style={{ fontSize: 10, marginTop: 3, color: used ? S.muted : S.silver }}>
                          {used ? "✗ ISKORIŠTEN" : "✓ DOSTUPAN"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── EXISTING STEPS ─── */}
            {mode === "existing" && step === 0 && (
              <div>
                <div style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 3,
                  padding: "10px 14px", marginBottom: 14, fontSize: 13, color: S.silver, lineHeight: 1.6 }}>
                  💡 Klikni vozača za odabir (max 5). Nakon odabira pojavi se gumb{" "}
                  <strong style={{ color: S.gold }}>"DRS 2×"</strong> za postavljanje DRS Boosta.
                </div>
                {teamGroups.map(({ constructor: c, drivers: td }) => (
                  <div key={c.id} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", color: tc(c.id),
                      marginBottom: 6, fontWeight: 900 }}>▌ {c.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                      {td.map(d => (
                        <DriverCard key={d.id} driver={d}
                          selected={drivers.includes(d.id)}
                          isCaptain={captain === d.id}
                          onToggle={() => setDrivers(prev =>
                            prev.includes(d.id)
                              ? (captain === d.id && setCaptain(""), prev.filter(x => x !== d.id))
                              : prev.length < 5 ? [...prev, d.id] : prev
                          )}
                          onSetCaptain={() => setCaptain(d.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === "existing" && step === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CONSTRUCTORS_2025.map(c => (
                  <ConstructorCard key={c.id} constructor={c}
                    selected={constructors.includes(c.id)}
                    onToggle={() => setConstructors(prev =>
                      prev.includes(c.id) ? prev.filter(x => x !== c.id)
                        : prev.length < 2 ? [...prev, c.id] : prev
                    )}
                  />
                ))}
              </div>
            )}

            {mode === "existing" && step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {drivers.map((id, i) => {
                  const d = DRIVERS_2025.find(x => x.id === id)!;
                  const isSelected = captain === id;
                  return (
                    <div key={id} onClick={() => setCaptain(id)} style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      background: isSelected ? S.card2 : S.card,
                      borderTop: `2px solid ${isSelected ? S.white : S.border}`, borderRight: `2px solid ${isSelected ? S.white : S.border}`, borderBottom: `2px solid ${isSelected ? S.white : S.border}`,
                      borderLeft: `5px solid ${tc(d.team)}`,
                      borderRadius: 3, padding: "12px 16px",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: S.gold, fontFamily: "monospace", width: 16 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: isSelected ? S.white : S.silver }}>{d.shortName}</div>
                        <div style={{ fontSize: 11, color: S.muted }}>{d.name} · {d.team}</div>
                      </div>
                      <div style={{ fontSize: 13, color: S.gold, fontFamily: "monospace" }}>${d.price}M</div>
                      {isSelected
                        ? <div style={{ background: S.red, color: "#fff", fontSize: 11,
                            fontWeight: 900, padding: "3px 9px", borderRadius: 2 }}>✓ DRS 2×</div>
                        : <div style={{ border: `1px solid ${S.border}`, color: S.muted,
                            fontSize: 11, padding: "3px 9px", borderRadius: 2 }}>ODABERI</div>
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {mode === "existing" && step === 3 && (
              <div>
                <div style={{ background: S.card2, border: `2px solid ${S.gold}44`,
                  borderRadius: 4, padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, letterSpacing: "0.18em", color: S.gold, marginBottom: 12, fontWeight: 700 }}>
                    💰 PREOSTALI BUDŽET
                  </div>
                  <p style={{ fontSize: 13, color: S.silver, lineHeight: 1.7, margin: "0 0 14px" }}>
                    Otvori <strong style={{ color: S.white }}>F1 Fantasy app</strong> i unesi
                    točan iznos preostalog budžeta koji tamo vidiš (u milijunima).
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: S.gold, fontSize: 20, fontWeight: 900 }}>$</span>
                    <input type="number" step="0.1" min="0" max="30"
                      value={remainingBudget}
                      onChange={e => setRemainingBudget(parseFloat(e.target.value) || 0)}
                      style={{ background: S.card, border: `2px solid ${S.gold}66`,
                        color: S.gold, padding: "12px 14px", borderRadius: 3,
                        fontSize: 28, fontWeight: 900, fontFamily: "monospace",
                        width: 130, outline: "none", textAlign: "center" }}
                    />
                    <span style={{ color: S.gold, fontSize: 20, fontWeight: 900 }}>M</span>
                  </div>
                </div>
                <Label>Slobodni transferi ovaj vikend</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setFreeTransfers(n)} style={{
                      flex: 1, padding: "12px", cursor: "pointer",
                      background: freeTransfers === n ? S.blue + "22" : S.card2,
                      border: `2px solid ${freeTransfers === n ? S.blue : S.border}`,
                      color: freeTransfers === n ? S.blue : S.silver,
                      borderRadius: 3, fontFamily: "monospace", fontSize: 18, fontWeight: 900,
                    }}>{n}{freeTransfers === n && <div style={{ fontSize: 10, color: S.blue }}>✓</div>}</button>
                  ))}
                </div>
              </div>
            )}

            {mode === "existing" && step === 4 && (
              <div>
                <div style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 3,
                  padding: "10px 14px", marginBottom: 14, fontSize: 13, color: S.silver }}>
                  💡 Klikni chipove koje si već <strong style={{ color: S.err }}>iskoristio</strong>.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {CHIPS.map(chip => {
                    const used = usedChips.includes(chip.id);
                    return (
                      <div key={chip.id} title={chip.desc}
                        onClick={() => setUsedChips(prev =>
                          prev.includes(chip.id) ? prev.filter(c => c !== chip.id) : [...prev, chip.id]
                        )}
                        style={{
                          background: used ? S.card : S.card2,
                          border: `2px solid ${used ? S.border : S.blue}`,
                          borderRadius: 3, padding: "14px 8px", cursor: "pointer",
                          textAlign: "center", opacity: used ? 0.35 : 1,
                        }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{chip.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: used ? S.muted : S.blue }}>{chip.label}</div>
                        <div style={{ fontSize: 10, marginTop: 3, color: used ? S.muted : S.silver }}>
                          {used ? "✗ ISKORIŠTEN" : "✓ DOSTUPAN"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === "existing" && step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {TRACKS_2025.map(t => {
                  const isPast = t.date < new Date().toISOString().slice(0, 10);
                  const isSelected = track.id === t.id;
                  return (
                    <div key={t.id} onClick={() => !isPast && setTrack(t)} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      cursor: isPast ? "default" : "pointer",
                      background: isSelected ? S.card2 : S.card,
                      border: `2px solid ${isSelected ? S.white : S.border}`,
                      borderRadius: 3, padding: "10px 14px",
                      opacity: isPast ? 0.3 : 1,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: S.gold,
                        fontFamily: "monospace", minWidth: 22 }}>R{t.round}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? S.white : S.text }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 10, color: S.muted }}>{t.date} · {t.country}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.isSprint && <Pill color="#FF8000" icon="⚡">SPRINT</Pill>}
                        {t.circuitType === "street" && <Pill color={S.blue} icon="🏙">STREET</Pill>}
                        {isSelected && <Pill color={S.gold} icon="✓">ODABRANO</Pill>}
                        {isPast && <Pill color={S.muted}>PROŠLO</Pill>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`,
            display: "flex", justifyContent: "flex-end", background: T.card2 }}>
            <button
              onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : finish()}
              disabled={!canNext}
              style={{
                background: canNext ? `linear-gradient(135deg, ${T.red}, ${T.red}88)` : S.border,
                border: "none", borderRadius: 3, padding: "10px 28px",
                color: canNext ? "#fff" : S.muted,
                cursor: canNext ? "pointer" : "not-allowed",
                fontFamily: "monospace", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em",
              }}>
              {step === steps.length - 1
                ? (mode === "fresh" ? "⚡ PREDLOŽI OPTIMALNI TIM" : "⚡ POKRENI ANALIZU")
                : "DALJE →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FRESH TEAM RESULT ────────────────────────────────────────────────────────
// ─── FULL-SCREEN RESULT VIEW ─────────────────────────────────────────────────
/**
 * After prediction: clears the page, shows current team vs recommended team
 * side-by-side, with changes + chip recommendation below.
 */
function ResultView({
  prediction, appState, T, onReset,
}: {
  prediction: any;
  appState: NonNullable<any>;
  T: ReturnType<typeof getTheme>;
  onReset: () => void;
}) {
  const [tooltip, setTooltip] = useState<{x:number,y:number,content:string}|null>(null);

  const { drivers, constructors, captain, track, mode, remainingBudget } = appState;
  const isFresh = mode === "fresh";

  // Current team (drivers → Driver objects)
  const currentDrivers = drivers.map((id: string) => DRIVERS_2025.find(d => d.id === id)).filter(Boolean);
  const currentConstrs  = constructors.map((id: string) => CONSTRUCTORS_2025.find(c => c.id === id)).filter(Boolean);

  // Recommended team
  const recTeam = prediction.recommendedTeam;
  const recDriverCodes: string[] = isFresh ? (prediction.suggestedDrivers ?? []) : (recTeam?.drivers ?? []);
  const recConstrIds:   string[] = isFresh ? (prediction.suggestedConstructors ?? []) : (recTeam?.constructors ?? []);

  const recDrivers = recDriverCodes.map((code: string) => DRIVERS_2025.find(d => d.shortName === code)).filter(Boolean);
  const recConstrs  = recConstrIds.map((id: string) => CONSTRUCTORS_2025.find(c => c.id === id)).filter(Boolean);

  // All expected pts
  const allPts: Record<string,number> = prediction.allExpectedPts ?? {};
  const getDriverPts = (code: string) => {
    const p = allPts[code] ?? prediction.predictedPoints?.[code];
    return p !== undefined ? parseFloat(String(p)).toFixed(1) : "—";
  };
  const getConstrPts = (id: string) => {
    const p = (prediction.constructorPoints ?? {})[id];
    return p !== undefined ? parseFloat(String(p)).toFixed(1) : "—";
  };

  // Current total vs recommended total
  const _rawCur = prediction.totalExpectedPoints;
  const _rawRec = isFresh
    ? prediction.totalExpectedPoints
    : (prediction.totalExpectedPointsAfterTransfers ?? prediction.totalExpectedPoints);
  const curTotal = (_rawCur != null && isFinite(_rawCur)) ? _rawCur : 0;
  const recTotal = (_rawRec != null && isFinite(_rawRec)) ? _rawRec : 0;
  const netDelta = parseFloat((recTotal - curTotal).toFixed(1));

  // Changes
  const transfers: any[] = prediction.transfers ?? [];
  const changedDriverCodes: string[] = recTeam?.changedDrivers ?? (isFresh ? recDriverCodes : []);
  const changedConstrIds:   string[] = recTeam?.changedConstructors ?? (isFresh ? recConstrIds : []);

  const drsCode = prediction.drsBoostRecommendation?.driverId ?? captain;
  const bestChip = prediction.chipRecommendations?.[0];

  // Row component used in both columns
  const Row = ({
    code, teamId, isPts, isNew, isOut, tooltipStr,
  }: {
    code: string; teamId: string; isPts: string;
    isNew: boolean; isOut: boolean; tooltipStr?: string;
  }) => {
    const d = DRIVERS_2025.find(x => x.shortName === code);
    const color = tc(teamId);
    const isDrs = code === drsCode;
    return (
      <div
        onMouseEnter={e => tooltipStr && setTooltip({ x: e.clientX, y: e.clientY, content: tooltipStr })}
        onMouseLeave={() => setTooltip(null)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px",
          background: isNew ? color + "20" : isOut ? S.err + "10" : S.card,
          borderTop: `1px solid ${isNew ? color : isOut ? S.err + "40" : S.border}`,
          borderRight: `1px solid ${isNew ? color : isOut ? S.err + "40" : S.border}`,
          borderBottom: `1px solid ${isNew ? color : isOut ? S.err + "40" : S.border}`,
          borderLeft: `5px solid ${color}`,
          borderRadius: 3, marginBottom: 5, cursor: tooltipStr ? "pointer" : "default",
          transition: "background 0.15s",
        }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: S.white, letterSpacing: "0.06em" }}>{code}</span>
            {isDrs && !isOut && (
              <span style={{ background: T.red + "30", color: T.red, border: `1px solid ${T.red}60`,
                fontSize: 11, padding: "1px 7px", borderRadius: 2, fontWeight: 900 }}>⚡ DRS</span>
            )}
            {isNew && (
              <span style={{ background: color + "30", color, border: `1px solid ${color}60`,
                fontSize: 11, padding: "1px 7px", borderRadius: 2, fontWeight: 900 }}>✓ NOVO</span>
            )}
            {isOut && (
              <span style={{ background: S.err + "20", color: S.err, border: `1px solid ${S.err}50`,
                fontSize: 11, padding: "1px 7px", borderRadius: 2, fontWeight: 900 }}>OUT</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>
            {d?.team?.toUpperCase()} · ${d?.price}M
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace",
            color: isNew ? color : isOut ? S.muted : S.gold }}>
            {isPts}
          </div>
          {isNew && !isFresh && (
            <div style={{ fontSize: 11, color: S.muted }}>pts</div>
          )}
        </div>
      </div>
    );
  };

  const ConstrRow = ({ id, isNew, isOut, tooltipStr }: {
    id: string; isNew: boolean; isOut: boolean; tooltipStr?: string;
  }) => {
    const c = CONSTRUCTORS_2025.find(x => x.id === id);
    const color = tc(id);
    return (
      <div
        onMouseEnter={e => tooltipStr && setTooltip({ x: e.clientX, y: e.clientY, content: tooltipStr })}
        onMouseLeave={() => setTooltip(null)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          background: isNew ? color+"20" : isOut ? S.err+"10" : S.card,
          borderTop: `1px solid ${isNew ? color : isOut ? S.err+"40" : S.border}`,
          borderRight: `1px solid ${isNew ? color : isOut ? S.err+"40" : S.border}`,
          borderBottom: `1px solid ${isNew ? color : isOut ? S.err+"40" : S.border}`,
          borderLeft: `5px solid ${color}`,
          borderRadius: 3, marginBottom: 5, cursor: tooltipStr ? "pointer" : "default",
        }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: S.white }}>{c?.shortName}</span>
            {isNew && <span style={{ background: color+"30", color, border: `1px solid ${color}60`,
              fontSize: 11, padding: "1px 7px", borderRadius: 2, fontWeight: 900 }}>✓ NOVO</span>}
            {isOut && <span style={{ background: S.err+"20", color: S.err, border: `1px solid ${S.err}50`,
              fontSize: 11, padding: "1px 7px", borderRadius: 2, fontWeight: 900 }}>OUT</span>}
          </div>
          <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{c?.name} · ${c?.price}M</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace",
          color: isNew ? color : isOut ? S.muted : S.gold }}>
          {getConstrPts(id)}
        </div>
      </div>
    );
  };

  const TotalBar = ({ total, delta, label }: { total: number | null | undefined; delta?: number; label: string }) => {
    const safeTotal = (total != null && isFinite(total)) ? total : null;
    return (
    <div style={{ padding: "14px 16px", background: S.card2, borderRadius: 3, marginTop: 8,
      borderTop: `1px solid ${S.border}`, borderRight: `1px solid ${S.border}`,
      borderBottom: `1px solid ${S.border}`, borderLeft: `4px solid ${T.red}` }}>
      <div style={{ fontSize: 11, color: S.muted, letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: S.gold, fontFamily: "monospace" }}>
          {safeTotal != null ? safeTotal.toFixed(1) : "—"}
        </span>
        {delta !== undefined && delta > 0 && (
          <span style={{ fontSize: 18, fontWeight: 900, color: "#4ADE80", fontFamily: "monospace" }}>
            +{delta.toFixed(1)}
          </span>
        )}
        <span style={{ fontSize: 13, color: S.muted }}>pts</span>
      </div>
    </div>
  );};

  // Build tooltip content for each transfer
  const getTransferTooltip = (t: any) => {
    const lines = [
      `${t.isFree ? "✓ Besplatan transfer" : `! Plaćeni transfer (−${t.penaltyCost} pts)`}`,
      `Dobitak bodova: +${t.pointsGainEV} pts`,
      t.penaltyCost > 0 ? `Penalizacija: −${t.penaltyCost} pts` : null,
      `Neto dobitak: +${t.netGain} pts`,
      `Budžet poslije transfera: $${t.budgetAfterTransfer}M`,
    ].filter(Boolean).join("\n");
    return lines;
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.gradient, backgroundAttachment: "fixed",
      fontFamily: "'Courier New', monospace", color: S.text,
    }}>
      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 14, top: tooltip.y - 10, zIndex: 999,
          background: "#0A0A1A", border: `1px solid ${T.red}`,
          borderRadius: 4, padding: "10px 14px",
          maxWidth: 240, pointerEvents: "none",
          boxShadow: `0 4px 24px ${T.red}33`,
        }}>
          {tooltip.content.split("\n").map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: i===0 ? S.white : S.silver, marginBottom: 3, lineHeight: 1.4 }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Slim header */}
      <header style={{
        borderBottom: `1px solid ${S.border}`, padding: "10px 20px",
        background: T.headerGradient,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${T.red}, ${S.gold})` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, flexShrink: 0 }}>
            <svg viewBox={T.markViewBox} width="100%" height="100%"
              dangerouslySetInnerHTML={{ __html: T.mark }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: T.textOnPrimary === "#000" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)", letterSpacing:"0.2em" }}>
              F1 FANTASY · 2026
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.textOnPrimary === "#000" ? "#000" : "#fff", lineHeight: 1 }}>
              PREDICTOR
            </div>
          </div>
          <div style={{ marginLeft: 16, padding: "3px 10px", background: S.card2,
            border: `1px solid ${S.border}`, borderRadius: 3, fontSize: 12, color: S.silver }}>
            R{track?.round} · {track?.name}
            {track?.isSprint && (
              <span style={{ marginLeft: 6, background: "#FF800030", color: "#FF8000",
                border: "1px solid #FF800060", fontSize: 10, padding: "1px 6px", borderRadius: 2 }}>⚡ SPRINT</span>
            )}
          </div>
        </div>
        <button onClick={onReset} style={{
          background: "none", border: `1px solid ${S.border}`, borderRadius: 3,
          color: S.muted, padding: "5px 14px", cursor: "pointer",
          fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em",
        }}>↺ NOVI UNOS</button>
      </header>

      {/* Main: two columns */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* LEFT — Current team */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", color: S.muted,
              marginBottom: 12, textTransform: "uppercase" }}>
              {isFresh ? "Tvoji uneseni parametri" : "Tvoj trenutni tim"}
            </div>
            {isFresh ? (
              <div style={{ padding: "20px", background: S.card, borderRadius: 4, textAlign: "center",
                border: `1px solid ${S.border}` }}>
                <div style={{ fontSize: 14, color: S.silver }}>Budžet: <strong style={{ color: S.gold }}>${appState.totalBudget}M</strong></div>
                <div style={{ fontSize: 13, color: S.muted, marginTop: 8 }}>App je odabrao optimalni tim unutar ovog budžeta.</div>
              </div>
            ) : (
              <>
                {currentDrivers.map((d: any) => (
                  <Row key={d.id} code={d.shortName} teamId={d.team}
                    isPts={getDriverPts(d.shortName)}
                    isNew={false}
                    isOut={changedDriverCodes.includes(d.shortName)
                      ? !isFresh
                        ? transfers.some((t:any)=>t.out===d.shortName)
                        : false
                      : false}
                    tooltipStr={undefined}
                  />
                ))}
                <div style={{ height: 8 }} />
                {currentConstrs.map((c: any) => (
                  <ConstrRow key={c.id} id={c.id} isNew={false}
                    isOut={transfers.some((t:any)=>t.out===c.id && t.isConstructor)}
                    tooltipStr={undefined}
                  />
                ))}
                <TotalBar total={curTotal} label="UKUPNO · TRENUTNI TIM" />
              </>
            )}
          </div>

          {/* RIGHT — Recommended team */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", color: T.red,
              marginBottom: 12, textTransform: "uppercase" }}>
              {isFresh ? "Preporučeni optimalni tim" : "Preporučeni novi tim"}
            </div>
            {recDrivers.map((d: any) => {
              const isNew = changedDriverCodes.includes(d.shortName) || isFresh;
              const transfer = transfers.find((t:any)=>t.in===d.shortName);
              const tip = transfer ? getTransferTooltip(transfer) : undefined;
              return (
                <Row key={d.id} code={d.shortName} teamId={d.team}
                  isPts={getDriverPts(d.shortName)}
                  isNew={isNew} isOut={false}
                  tooltipStr={tip}
                />
              );
            })}
            <div style={{ height: 8 }} />
            {recConstrs.map((c: any) => {
              const isNew = changedConstrIds.includes(c.id) || isFresh;
              const transfer = transfers.find((t:any)=>t.in===c.id && t.isConstructor);
              const tip = transfer ? getTransferTooltip(transfer) : undefined;
              return (
                <ConstrRow key={c.id} id={c.id} isNew={isNew} isOut={false} tooltipStr={tip} />
              );
            })}
            <TotalBar
              total={recTotal}
              delta={!isFresh && netDelta > 0 ? netDelta : undefined}
              label="UKUPNO · PREPORUČENI TIM"
            />
          </div>
        </div>

        {/* Bottom strip: changes + chip */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 6,
          overflow: "hidden" }}>
          {/* Sessions warning */}
          {prediction.sessionsWarning && (
            <div style={{ padding: "10px 20px", borderBottom: `1px solid ${S.border}`,
              background: "#FFD70010", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:14 }}>⚠️</span>
              <span style={{ fontSize:12, color:"#FFD700", lineHeight:1.5 }}>
                {prediction.sessionsWarning}
              </span>
              <span style={{ marginLeft:"auto", fontSize:10, color:S.muted, fontFamily:"monospace",
                padding:"2px 8px", background:S.card2, border:`1px solid ${S.border}`, borderRadius:2 }}>
                noise: {prediction.dataStatus?.noiseLevel?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Weak links */}
          {prediction.weakLinks?.length > 0 && (
            <div style={{ padding: "10px 20px", borderBottom: `1px solid ${S.border}`,
              display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, letterSpacing:"0.2em", color:S.muted }}>SLABE KARIKE</span>
              {prediction.weakLinks.map((w: any) => (
                <div key={w.code} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
                  background: w.type==="hard_out" ? S.err+"15" : "#FFD70015",
                  border:`1px solid ${w.type==="hard_out" ? S.err+"50" : "#FFD70050"}`,
                  borderRadius:3, cursor:"default",
                }}
                title={w.reason}>
                  <span style={{ fontSize:11, color: w.type==="hard_out" ? S.err : "#FFD700" }}>
                    {w.type==="hard_out" ? "🔴" : "🟡"}
                  </span>
                  <span style={{ fontSize:12, fontWeight:900, color:S.white }}>{w.code}</span>
                  <span style={{ fontSize:10, color:S.muted }}>
                    {w.type==="hard_out" ? "tvrdi izbacaj" : "prodaj-prije-pada"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Changes row */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}`,
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: S.muted, flexShrink: 0 }}>
              IZMJENE
            </div>
            {transfers.length === 0 ? (
              <span style={{ fontSize: 13, color: S.silver }}>
                {prediction.recommendedTeam?.unchanged
                  ? "Tvoj tim je već optimalan ovaj vikend — nema izmjena."
                  : "Nema isplativih izmjena unutar budžeta."}
              </span>
            ) : (
              transfers.map((t: any, i: number) => (
                <div key={i}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, content: getTransferTooltip(t) })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "6px 12px", borderRadius: 3,
                    background: t.isFree ? "#5AB4FF15" : "#FFD70015",
                    border: `1px solid ${t.isFree ? "#5AB4FF50" : "#FFD70050"}`,
                  }}>
                  <span style={{ fontSize: 10, color: t.isFree ? "#5AB4FF" : "#FFD700", fontWeight: 700 }}>
                    {t.isFree ? "✓" : "!"}
                  </span>
                  <span style={{ fontSize: 13, color: S.err, fontWeight: 900 }}>{t.out}</span>
                  <span style={{ color: S.muted }}>→</span>
                  <span style={{ fontSize: 13, color: "#5AB4FF", fontWeight: 900 }}>{t.in}</span>
                  <span style={{ fontSize: 12, color: t.isFree ? "#5AB4FF" : "#FFD700",
                    fontFamily: "monospace" }}>
                    {t.isFree ? "" : `−${t.penaltyCost}pts `}+{t.netGain}pts
                  </span>
                  <span style={{ fontSize:9, padding:"1px 5px",
                    background: t.inConfidence==="HIGH" ? S.gold+"22" : t.inConfidence==="MEDIUM" ? "#5AB4FF22" : S.muted+"22",
                    color: t.inConfidence==="HIGH" ? S.gold : t.inConfidence==="MEDIUM" ? "#5AB4FF" : S.muted,
                    borderRadius:2, letterSpacing:"0.05em" }}>
                    {t.inConfidence}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* DRS + Chip row */}
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {/* DRS */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: S.muted }}>DRS BOOST</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: T.red }}>⚡ {drsCode}</span>
              {prediction.drsBoostRecommendation?.reason && (
                <div
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY,
                    content: prediction.drsBoostRecommendation.reason })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer", fontSize: 12, color: S.muted,
                    borderBottom: `1px dashed ${S.border}` }}>
                  zašto?
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: S.border }} />

            {/* Chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: S.muted }}>CHIP</span>
              {bestChip ? (
                <>
                  <span style={{ fontSize: 16 }}>{bestChip.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 900,
                    color: bestChip.label === "PREPORUČENO" ? "#5AB4FF" : S.gold }}>
                    {bestChip.label === "PREPORUČENO"
                      ? bestChip.chip.replace("_", " ").toUpperCase()
                      : `SAČUVAJ (${bestChip.chip.replace("_"," ")})`}
                  </span>
                  <div
                    onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, content: bestChip.reason })}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: "pointer", fontSize: 12, color: S.muted,
                      borderBottom: `1px dashed ${S.border}` }}>
                    zašto?
                  </div>
                </>
              ) : (
                <span style={{ fontSize: 13, color: S.muted }}>Nema dostupnih chipova</span>
              )}
            </div>

            {/* AI analysis hover */}
            {prediction.analysis && (
              <>
                <div style={{ width: 1, height: 28, background: S.border }} />
                <div
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, content: prediction.analysis })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer", fontSize: 12, color: S.muted,
                    borderBottom: `1px dashed ${S.border}` }}>
                  📊 AI analiza
                </div>
              </>
            )}

            {/* Data status */}
            {prediction.dataStatus && (
              <div style={{ marginLeft: "auto", fontSize: 10, color: S.muted,
                fontFamily: "monospace", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                <span>📊 2026: {prediction.dataStatus.form2026==="OK"?"✓":"!"}</span>
                <span>🏁 Staza: {prediction.dataStatus.trackHistory==="OK"?"✓":"!"}</span>
                <span style={{
                  color: prediction.dataStatus.weekendData !== "UNAVAILABLE"
                    ? (prediction.dataStatus.gridAvailable ? S.gold : "#5AB4FF")
                    : S.muted
                }}>
                  {prediction.dataStatus.weekendData === "UNAVAILABLE"
                    ? "🔴 Nema trening podataka"
                    : prediction.dataStatus.gridAvailable
                      ? "🟡 ✓ Qualifying učitan"
                      : `🔵 ✓ ${prediction.dataStatus.weekendData} (noise: ${prediction.dataStatus.noiseLevel})`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Avoid list + archetype (fresh mode only) */}
        {isFresh && (prediction.avoidList?.length > 0 || prediction.archetype) && (
          <div style={{ maxWidth:1100, margin:"12px auto 0", padding:"0 16px", display:"flex", gap:16, flexWrap:"wrap" }}>

            {/* Archetype */}
            {prediction.archetype && (
              <div style={{ flex:"0 0 auto", background:S.card, border:`1px solid ${S.border}`,
                borderRadius:4, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:14 }}>{prediction.archetype==="stars_and_scrubs"?"⭐":"⚖️"}</span>
                <div>
                  <div style={{ fontSize:10, color:S.muted, letterSpacing:"0.15em" }}>ARHETIP</div>
                  <div style={{ fontSize:13, fontWeight:900, color:S.white }}>
                    {prediction.archetype==="stars_and_scrubs" ? "Stars & Scrubs" : "Balanced"}
                  </div>
                  <div style={{ fontSize:11, color:S.muted }}>
                    {prediction.archetype==="stars_and_scrubs"
                      ? "2 Tier-A konstruktora + jeftini punioci"
                      : "Mješoviti konstruktori + dublja vozačka linija"}
                  </div>
                </div>
              </div>
            )}

            {/* Kombinacije */}
            {prediction.considered > 0 && (
              <div style={{ flex:"0 0 auto", background:S.card, border:`1px solid ${S.border}`,
                borderRadius:4, padding:"10px 16px" }}>
                <div style={{ fontSize:10, color:S.muted, letterSpacing:"0.15em" }}>PRETRAŽIVANJE</div>
                <div style={{ fontSize:13, fontWeight:900, color:S.gold }}>
                  {prediction.considered.toLocaleString()} kombinacija
                </div>
                <div style={{ fontSize:11, color:S.muted }}>iscrpna pretraga · globalni optimum</div>
              </div>
            )}

            {/* Avoid list */}
            {prediction.avoidList?.length > 0 && (
              <div style={{ flex:1, minWidth:200, background:S.card, border:`1px solid ${S.border}`,
                borderRadius:4, padding:"10px 16px" }}>
                <div style={{ fontSize:10, color:S.muted, letterSpacing:"0.15em", marginBottom:8 }}>
                  AVOID LISTA — filtrirani iz pretrage
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {prediction.avoidList.map((a:any) => (
                    <div key={a.code}
                      onMouseEnter={e => setTooltip({x:e.clientX,y:e.clientY,content:`${a.code}: ${a.reason}`})}
                      onMouseLeave={() => setTooltip(null)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
                        background:S.err+"12", border:`1px solid ${S.err}40`, borderRadius:3, cursor:"default" }}>
                      <span style={{ fontSize:12, fontWeight:900, color:S.err }}>{a.code}</span>
                      <span style={{ fontSize:10, color:S.muted }}>${a.price}M</span>
                      <span style={{ fontSize:10, color:S.muted }}>EV:{a.ev?.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                {prediction.avoidRationale && (
                  <div style={{ fontSize:11, color:S.muted, marginTop:8, lineHeight:1.5 }}>
                    {prediction.avoidRationale}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price warning — always shown for fresh mode */}
        {isFresh && (
          <div style={{ maxWidth:1100, margin:"8px auto 4px", padding:"0 16px" }}>
            <div style={{ background:"#FF800018", border:`1px solid #FF800060`,
              borderRadius:4, padding:"10px 16px",
              display:"flex", alignItems:"flex-start", gap:10 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
              <div>
                <div style={{ fontSize:13, color:"#FF8000", fontWeight:700, marginBottom:3 }}>
                  Provjeri cijene u F1 Fantasy builderu!
                </div>
                <div style={{ fontSize:12, color:S.silver, lineHeight:1.6 }}>
                  Cijene vozača i konstruktora mijenjaju se nakon svake utrke.
                  Naše cijene su ažurirane za R9 British GP — ali potvrdi u builderu
                  da ukupna cijena tima stane unutar $100M prije zaključavanja.
                  Ako ne stane, zamijeni najskupljeg punioca jeftinijom opcijom.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confidence note (fresh only) */}
        {isFresh && prediction.confidenceNote && (
          <div style={{ maxWidth:1100, margin:"8px auto 16px", padding:"0 16px" }}>
            <div style={{ background:"#FFD70010", border:`1px solid #FFD70030`,
              borderRadius:4, padding:"10px 16px",
              display:"flex", alignItems:"flex-start", gap:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
              <span style={{ fontSize:12, color:"#FFD700", lineHeight:1.6 }}>
                {prediction.confidenceNote}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


function FreshResult({ prediction, track, totalBudget, onReset }: {
  prediction: any; track: Track; totalBudget: number; onReset: () => void;
}) {
  const suggestedDrivers: Driver[] = (prediction.suggestedDrivers ?? [])
    .map((code: string) => DRIVERS_2025.find(d => d.shortName === code))
    .filter(Boolean);
  const suggestedConstructors: Constructor[] = (prediction.suggestedConstructors ?? [])
    .map((id: string) => CONSTRUCTORS_2025.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "'Courier New', monospace", padding: "20px 16px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: S.gold, letterSpacing: "0.2em" }}>F1 FANTASY · NOVI TIM</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: S.white }}>{track.name}</div>
          </div>
          <button onClick={onReset} style={{
            background: "none", border: `2px solid ${S.border}`, borderRadius: 3,
            color: S.silver, padding: "6px 14px", cursor: "pointer",
            fontFamily: "monospace", fontSize: 12,
          }}>↺ RESET</button>
        </div>

        {/* Total */}
        <div style={{ border: `2px solid ${S.gold}`, borderRadius: 4, padding: "18px 24px",
          textAlign: "center", background: "#0A0A06", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: S.gold, letterSpacing: "0.28em", marginBottom: 4 }}>
            OPTIMALNI TIM · PREDVIĐENI BODOVI
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: S.white, fontFamily: "monospace", lineHeight: 1 }}>
            {prediction.totalExpectedPoints ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: S.muted, marginTop: 6, display: "flex", justifyContent: "center", gap: 16 }}>
            <span>💰 Ukupno: <strong style={{ color: S.gold }}>${prediction.totalCost ?? "—"}M</strong></span>
            <span>💵 Preostalo: <strong style={{ color: S.ok }}>${prediction.remainingBudget ?? "—"}M</strong></span>
          </div>
        </div>

        {/* Suggested drivers */}
        <Label>Preporučeni vozači</Label>
        <div style={{ border: `2px solid ${S.border}`, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ background: "#080812", borderBottom: `1px solid ${S.border}`,
            padding: "5px 14px", display: "flex", fontSize: 10,
            color: S.muted, letterSpacing: "0.15em", fontWeight: 700 }}>
            <span style={{ width: 24 }}>#</span>
            <span style={{ flex: 1 }}>VOZAČ</span>
            <span>BODOVI</span>
          </div>
          {suggestedDrivers.map((d, i) => {
            const pts = prediction.predictedPoints?.[d.shortName];
            const isCapt = d.shortName === prediction.captain;
            return (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: i % 2 === 0 ? S.card : S.card2,
                borderBottom: i < suggestedDrivers.length - 1 ? `1px solid ${S.border}` : "none",
                borderLeft: `5px solid ${tc(d.team)}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: S.gold, fontFamily: "monospace", width: 20 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: S.white }}>{d.shortName}</span>
                    <span style={{ fontSize: 11, color: S.muted }}>{d.name}</span>
                    {isCapt && <span style={{ background: S.red, color: "#fff", fontSize: 10,
                      padding: "1px 6px", borderRadius: 2, fontWeight: 900 }}>⚡ DRS 2×</span>}
                  </div>
                  <div style={{ fontSize: 10, color: S.muted }}>{d.team.toUpperCase()} · ${d.price}M</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: S.white }}>
                  {pts ?? "?"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested constructors */}
        <Label>Preporučeni konstruktori</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {suggestedConstructors.map(c => {
            const pts = prediction.constructorPoints?.[c.id];
            return (
              <div key={c.id} style={{ flex: 1, background: S.card,
                borderTop: `2px solid ${S.border}`, borderRight: `2px solid ${S.border}`, borderBottom: `2px solid ${S.border}`, borderLeft: `5px solid ${tc(c.id)}`,
                borderRadius: 3, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: S.white }}>{c.shortName}</div>
                  <div style={{ fontSize: 10, color: S.muted }}>{c.name} · ${c.price}M</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: S.white, fontFamily: "monospace" }}>{pts ?? "?"}</div>
              </div>
            );
          })}
        </div>

        {/* DRS */}
        {prediction.drsBoostRecommendation && (
          <div style={{ background: S.card, borderTop: `2px solid ${S.border}`, borderRight: `2px solid ${S.border}`, borderBottom: `2px solid ${S.border}`,
            borderLeft: `5px solid ${S.red}`, borderRadius: 3, padding: "12px 14px", marginBottom: 12 }}>
            <Label>DRS Boost</Label>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: S.white }}>
                  {prediction.drsBoostRecommendation.driverId?.toUpperCase()}
                  <span style={{ background: S.red, color: "#fff", fontSize: 11,
                    padding: "2px 7px", borderRadius: 2, marginLeft: 8, fontWeight: 900 }}>2×</span>
                </div>
                <div style={{ fontSize: 13, color: S.silver, marginTop: 3 }}>
                  {prediction.drsBoostRecommendation.reason}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rationale */}
        {prediction.teamRationale && (
          <div style={{ background: S.card, border: `2px solid ${S.border}`,
            borderRadius: 3, padding: "12px 14px", marginBottom: 12 }}>
            <Label>Zašto ovaj tim?</Label>
            <p style={{ fontSize: 13, color: S.silver, lineHeight: 1.8, margin: 0 }}>{prediction.teamRationale}</p>
          </div>
        )}
        {prediction.analysis && (
          <div style={{ background: S.card, border: `2px solid ${S.border}`,
            borderRadius: 3, padding: "12px 14px" }}>
            <Label>AI analiza</Label>
            <p style={{ fontSize: 13, color: S.silver, lineHeight: 1.8, margin: 0 }}>{prediction.analysis}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EXISTING TEAM PREDICTION PANEL ──────────────────────────────────────────
function PredictionPanel({ prediction, drivers, constructors, captain }: {
  prediction: any; drivers: string[]; constructors: string[]; captain: string;
}) {
  const teamDrivers = drivers.map(id => DRIVERS_2025.find(d => d.id === id)).filter(Boolean) as Driver[];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ border: `2px solid ${S.gold}`, borderRadius: 4, padding: "18px 24px",
        textAlign: "center", background: "#0A0808" }}>
        <div style={{ fontSize: 11, color: S.gold, letterSpacing: "0.28em", marginBottom: 4 }}>UKUPNO OČEKIVANIH BODOVA</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: S.white, fontFamily: "monospace", lineHeight: 1 }}>
          {prediction.totalExpectedPoints ?? "—"}
        </div>
      </div>

      {/* ── RECOMMENDED COMPLETE TEAM ── */}
      {prediction.recommendedTeam && (
        <div style={{ borderTop:"1px solid "+S.border, borderRight:"1px solid "+S.border,
          borderBottom:"1px solid "+S.border, borderLeft:"4px solid "+S.red,
          borderRadius: 4, padding: "14px 16px", background: S.card2, marginBottom: 12 }}>
          <Label>Preporučeni novi tim</Label>
          {prediction.recommendedTeam.unchanged
            ? <div style={{ fontSize: 13, color: S.silver, lineHeight: 1.7 }}>
                Tvoj trenutni tim je optimalan — nema isplativih izmjena ovaj vikend.
              </div>
            : <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                {(prediction.recommendedTeam.drivers ?? []).map((code: string) => {
                  const isNew = prediction.recommendedTeam.changedDrivers?.includes(code);
                  const pts = (prediction.allExpectedPts ?? {})[code] ?? (prediction.predictedPoints ?? {})[code];
                  const dData = DRIVERS_2025.find(d => d.shortName === code);
                  const color = tc(dData?.team ?? "");
                  const isDrs = code === prediction.drsBoostRecommendation?.driverId;
                  return (
                    <div key={code} style={{ display:"flex", alignItems:"center", gap:8,
                      padding:"9px 11px", borderRadius:3,
                      background: isNew ? color+"22" : S.card,
                      borderTop:`1px solid ${isNew?color:S.border}`,
                      borderRight:`1px solid ${isNew?color:S.border}`,
                      borderBottom:`1px solid ${isNew?color:S.border}`,
                      borderLeft:`5px solid ${color}` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <span style={{ fontSize:15, fontWeight:900, color:S.white }}>{code}</span>
                          {isNew && <span style={{ fontSize:11, background:color+"33", color,
                            padding:"1px 7px", borderRadius:2, fontWeight:700 }}>✓ NOVO</span>}
                          {isDrs && <span style={{ fontSize:11, background:"#E8002D33",
                            color:"#E8002D", padding:"1px 7px", borderRadius:2, fontWeight:700 }}>⚡ DRS</span>}
                        </div>
                        <div style={{ fontSize:11, color:S.muted }}>{dData?.team?.toUpperCase()} · ${dData?.price}M</div>
                      </div>
                      {pts !== undefined && (
                        <span style={{ fontSize:17, fontWeight:900, fontFamily:"monospace", color:S.gold }}>
                          {typeof pts==="number"?pts.toFixed(1):pts}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:7, marginBottom:10 }}>
                {(prediction.recommendedTeam.constructors ?? []).map((id: string) => {
                  const isNew = prediction.recommendedTeam.changedConstructors?.includes(id);
                  const c = CONSTRUCTORS_2025.find(x => x.id === id);
                  const pts = (prediction.constructorPoints ?? {})[id];
                  const color = tc(id);
                  return (
                    <div key={id} style={{ flex:1, padding:"9px 12px", borderRadius:3,
                      background:isNew?color+"22":S.card,
                      borderTop:`1px solid ${isNew?color:S.border}`,
                      borderRight:`1px solid ${isNew?color:S.border}`,
                      borderBottom:`1px solid ${isNew?color:S.border}`,
                      borderLeft:`5px solid ${color}`,
                      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:14, fontWeight:900, color:S.white }}>{c?.shortName}</span>
                          {isNew && <span style={{ fontSize:11, background:color+"33", color,
                            padding:"1px 7px", borderRadius:2, fontWeight:700 }}>✓ NOVO</span>}
                        </div>
                        <div style={{ fontSize:11, color:S.muted }}>{c?.name}</div>
                      </div>
                      {pts !== undefined && (
                        <span style={{ fontSize:17, fontWeight:900, fontFamily:"monospace", color:S.gold }}>
                          {typeof pts==="number"?pts.toFixed(1):pts}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {(prediction.totalNetGain ?? 0) > 0 && (
                <div style={{ padding:"9px 12px", borderRadius:3,
                  background:S.gold+"18",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, color:S.silver }}>
                    Projekcija poboljšanja:
                  </span>
                  <span style={{ fontSize:16, fontWeight:900, color:S.gold, fontFamily:"monospace" }}>
                    +{prediction.totalNetGain} pts neto
                  </span>
                </div>
              )}
            </>
          }
        </div>
      )}

      <Label>Bodovi po vozaču</Label>
      <div style={{ border: `2px solid ${S.border}`, borderRadius: 3, overflow: "hidden" }}>
        {teamDrivers.map((d, i) => {
          const pts = prediction.predictedPoints?.[d.shortName];
          const isCapt = d.id === captain;
          return (
            <div key={d.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: i % 2 === 0 ? S.card : S.card2,
              borderBottom: i < teamDrivers.length - 1 ? `1px solid ${S.border}` : "none",
              borderLeft: `5px solid ${tc(d.team)}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: S.gold, fontFamily: "monospace", width: 16 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: S.white }}>{d.shortName}</span>
                  {isCapt && <span style={{ background: S.red, color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 2, fontWeight: 900 }}>⚡ DRS 2×</span>}
                </div>
                <div style={{ fontSize: 10, color: S.muted }}>{d.team.toUpperCase()} · ${d.price}M</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace",
                  color: typeof pts === "number" ? (pts >= 20 ? S.gold : pts >= 0 ? S.white : S.err) : S.muted }}>
                  {pts ?? "?"}
                </div>
                {typeof pts === "number" && (
                  <div style={{ fontSize: 9, color: S.muted, textAlign: "right" }}>
                    {pts >= 30 ? "▲ ODLIČNO" : pts >= 15 ? "▲ DOBRO" : pts >= 0 ? "● OK" : "▼ MINUS"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {prediction.constructorPoints && <>
        <Label>Konstruktori</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {constructors.map(cid => {
            const c = CONSTRUCTORS_2025.find(x => x.id === cid)!;
            const pts = prediction.constructorPoints?.[cid];
            return (
              <div key={cid} style={{ flex: 1, background: S.card,
                borderTop: `2px solid ${S.border}`, borderRight: `2px solid ${S.border}`, borderBottom: `2px solid ${S.border}`, borderLeft: `5px solid ${tc(cid)}`,
                borderRadius: 3, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: S.white }}>{c.shortName}</div>
                  <div style={{ fontSize: 10, color: S.muted }}>${c.price}M</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: S.white, fontFamily: "monospace" }}>{pts ?? "?"}</div>
              </div>
            );
          })}
        </div>
      </>}

      {prediction.drsBoostRecommendation && (
        <div style={{ background: S.card, borderTop: `2px solid ${S.border}`, borderRight: `2px solid ${S.border}`, borderBottom: `2px solid ${S.border}`,
          borderLeft: `5px solid ${S.red}`, borderRadius: 3, padding: "12px 14px" }}>
          <Label>DRS Boost preporuka</Label>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: S.white }}>
                {prediction.drsBoostRecommendation.driverId?.toUpperCase()}
                <span style={{ background: S.red, color: "#fff", fontSize: 11,
                  marginLeft: 8, padding: "2px 7px", borderRadius: 2, fontWeight: 900 }}>PREPORUČENO</span>
              </div>
              <div style={{ fontSize: 13, color: S.silver, marginTop: 4 }}>{prediction.drsBoostRecommendation.reason}</div>
            </div>
          </div>
        </div>
      )}

      {/* No transfers explanation */}
      {prediction.transfers?.length === 0 && prediction.noTransferReason && (
        <div style={{ background: S.card, borderTop: `1px solid ${S.border}`,
          borderRight: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`,
          borderLeft: `3px solid ${S.gold}`,
          borderRadius: 3, padding: "12px 14px" }}>
          <Label>Preporučeni transferi</Label>
          <div style={{ fontSize: 13, color: S.silver, lineHeight: 1.7 }}>
            {prediction.noTransferReason}
          </div>
          {prediction.noTransferAlternatives?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: S.muted }}>
              Najjeftinija dostupna poboljšanja:
              {prediction.noTransferAlternatives.map((a: any) => (
                <span key={a.code} style={{ marginLeft: 8,
                  background: S.blue + "22", color: S.blue,
                  padding: "1px 7px", borderRadius: 2,
                  fontFamily: "monospace", fontSize: 10 }}>
                  {a.code} ~{a.pts.toFixed(1)}pts (+${a.delta.toFixed(1)}M)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {prediction.transfers?.length > 0 && (
        <div>
          <Label>Preporučeni transferi</Label>
          {/* Transfer summary row */}
          {prediction.transferSummary && (
            <div style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 3,
              padding: "8px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: S.silver }}>{prediction.transferSummary}</span>
              {prediction.totalNetGain != null && (
                <span style={{
                  background: prediction.totalNetGain >= 0 ? S.gold + "22" : S.err + "22",
                  border: `1px solid ${prediction.totalNetGain >= 0 ? S.gold : S.err}66`,
                  color: prediction.totalNetGain >= 0 ? S.gold : S.err,
                  fontSize: 13, fontWeight: 900, padding: "2px 10px", borderRadius: 2, fontFamily: "monospace",
                }}>
                  NETO: {prediction.totalNetGain >= 0 ? "+" : ""}{prediction.totalNetGain} pts
                </span>
              )}
            </div>
          )}
          {prediction.transfers.map((t: any, i: number) => (
            <div key={i} style={{ background: S.card, border: `2px solid ${S.border}`,
              borderRadius: 3, padding: "12px 14px", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {/* Transfer number badge */}
                <span style={{ background: t.isFree ? S.ok + "22" : S.warn + "22",
                  border: `1px solid ${t.isFree ? S.ok : S.warn}66`,
                  color: t.isFree ? S.ok : S.warn,
                  fontSize: 10, padding: "2px 7px", borderRadius: 2, fontWeight: 900 }}>
                  {t.isFree ? `✓ T${t.transferNumber} BESPLATAN` : `! T${t.transferNumber} −${t.penaltyCost} pts`}
                </span>
                <span style={{ background: S.err + "22", border: `1px solid ${S.err}44`,
                  color: S.err, fontSize: 14, fontWeight: 900, padding: "2px 8px", borderRadius: 2 }}>
                  OUT: {t.out}
                </span>
                <span style={{ color: S.muted, fontWeight: 900 }}>→</span>
                <span style={{ background: S.blue + "22", border: `1px solid ${S.blue}44`,
                  color: S.blue, fontSize: 14, fontWeight: 900, padding: "2px 8px", borderRadius: 2 }}>
                  IN: {t.in}
                </span>
                {t.budgetDelta != null && (
                  <Pill color={t.budgetDelta >= 0 ? S.gold : S.err} icon={t.budgetDelta >= 0 ? "▲" : "▼"}>
                    {t.budgetDelta >= 0 ? "+" : ""}{t.budgetDelta}M
                  </Pill>
                )}
              </div>
              {/* Net gain calculation */}
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: S.muted }}>
                  Dobitak: <strong style={{ color: S.white }}>+{t.pointsGainEV} pts</strong>
                </span>
                {!t.isFree && (
                  <span style={{ fontSize: 12, color: S.muted }}>
                    Penalizacija: <strong style={{ color: S.warn }}>−{t.penaltyCost} pts</strong>
                  </span>
                )}
                <span style={{ fontSize: 12, color: S.muted }}>
                  Neto: <strong style={{
                    color: (t.netGain ?? t.pointsGainEV) >= 0 ? S.gold : S.err,
                    fontFamily: "monospace"
                  }}>{(t.netGain ?? t.pointsGainEV) >= 0 ? "+" : ""}{t.netGain ?? t.pointsGainEV} pts</strong>
                </span>
                {t.budgetAfterTransfer != null && (
                  <span style={{ fontSize: 12, color: S.muted }}>
                    Budžet poslije: <strong style={{ color: S.gold, fontFamily: "monospace" }}>
                      ${t.budgetAfterTransfer.toFixed(1)}M
                    </strong>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: S.silver }}>{t.reason}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-driver best swap transparency panel */}
      {prediction.perDriverBestSwap?.length > 0 && (
        <div style={{ background: S.card, borderTop: `1px solid ${S.border}`,
          borderRight: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`,
          borderLeft: `3px solid ${S.muted}`,
          borderRadius: 3, padding: "12px 14px" }}>
          <Label>Procjena bodova — najbolja zamjena po vozaču</Label>
          <div style={{ fontSize: 11, color: S.muted, marginBottom: 10, lineHeight: 1.6 }}>
            Prikazuje procijenjene bodove za svakog vozača u tvom timu i najboljeg dostupnog zamjenika u tvom budžetu.
            Ako prijedlog nije uključen u transfer, znači da ga optimizer nije smatrao isplativim u kombinaciji s ostalim transferima.
          </div>
          {prediction.perDriverBestSwap.map((row: any) => (
            <div key={row.current} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 0",
              borderBottom: `1px solid ${S.border}`,
              flexWrap: "wrap",
            }}>
              {/* Current driver */}
              <div style={{ minWidth: 90, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: S.white }}>{row.current}</span>
                <span style={{ fontSize: 12, color: S.muted, fontFamily: "monospace" }}>
                  ~{row.currentPts}pts
                </span>
                <span style={{ fontSize: 11, color: S.muted }}>${row.currentPrice}M</span>
              </div>
              {/* Arrow + best alternative */}
              {row.bestAlternative ? (
                <>
                  <span style={{ color: S.muted, fontSize: 10 }}>→</span>
                  <span style={{ fontSize: 13, fontWeight: 900,
                    color: row.ptsGain > 5 ? S.gold : row.ptsGain > 0 ? S.text : S.muted }}>
                    {row.bestAlternative.code}
                  </span>
                  <span style={{ fontSize: 12, color: S.muted, fontFamily: "monospace" }}>
                    ~{row.bestAlternative.expectedPts}pts
                  </span>
                  <span style={{ fontSize: 11, color: S.muted }}>${row.bestAlternative.price}M</span>
                  <span style={{
                    fontSize: 11, padding: "1px 6px", borderRadius: 2, fontFamily: "monospace",
                    background: row.ptsGain > 5 ? S.gold + "22" : row.ptsGain > 0 ? S.text + "11" : S.muted + "11",
                    color: row.ptsGain > 5 ? S.gold : row.ptsGain > 0 ? S.text : S.muted,
                  }}>
                    {row.ptsGain > 0 ? "+" : ""}{row.ptsGain}pts
                    {row.budgetNeeded > 0 ? ` (-$${row.budgetNeeded}M)` : ` (+$${Math.abs(row.budgetNeeded)}M)`}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 11, color: S.muted, fontStyle: "italic" }}>
                  nema boljih u budžetu
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {prediction.chipRecommendations?.length > 0 && (
        <div>
          <Label>Chip preporuke — bazirana na stazi i formi</Label>
          {prediction.dataStatus && (
            <div style={{ background: S.card2, border: `1px solid ${S.border}`, borderRadius: 3,
              padding: "7px 12px", marginBottom: 8, fontSize: 11, color: S.muted,
              display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>📊 Forma 2026: <strong style={{ color: prediction.dataStatus.form2026 === "OK" ? S.ok : S.warn }}>
                {prediction.dataStatus.form2026 === "OK" ? "✓ Učitano" : "! Nedostupno"}
              </strong></span>
              <span>🏁 Historija staze: <strong style={{ color: prediction.dataStatus.trackHistory === "OK" ? S.ok : S.warn }}>
                {prediction.dataStatus.trackHistory === "OK" ? "✓ Učitano" : "! Nedostupno"}
              </strong></span>
              <span>💥 DNF rate: <strong style={{ color: S.gold }}>{prediction.dataStatus.avgDnfRate ? Math.round(prediction.dataStatus.avgDnfRate * 100) : "?"}%</strong></span>
              <span>🎯 Predvidivost: <strong style={{ color: S.gold }}>{prediction.dataStatus.predictability ?? "?"}%</strong></span>
            </div>
          )}
          {prediction.bestChip && (
            <div style={{ background: S.blue + "11", border: `2px solid ${S.blue}`,
              borderRadius: 3, padding: "10px 14px", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{CHIPS.find(c => c.id === prediction.bestChip)?.icon ?? "🎯"}</span>
              <div>
                <div style={{ fontSize: 11, color: S.blue, letterSpacing: "0.15em", marginBottom: 2 }}>
                  PREPORUČENI CHIP ZA OVAJ VIKEND
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: S.white }}>
                  {CHIPS.find(c => c.id === prediction.bestChip)?.label ?? prediction.bestChip.toUpperCase()}
                </div>
              </div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: S.blue, fontWeight: 700 }}>SAMO 1/VIKEND</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {prediction.chipRecommendations.map((c: any, i: number) => {
              const isBest = c.chip === prediction.bestChip;
              const borderColor = isBest ? S.blue : c.label === "PREPORUČENO" ? S.blue : c.label === "DOBRO" ? S.gold : S.border;
              const badgeBg = isBest ? S.blue : c.label === "PREPORUČENO" ? S.blue : c.label === "DOBRO" ? S.gold : S.muted;
              return (
                <div key={i} style={{
                  background: S.card,
                  borderTop: `2px solid ${i === 0 ? borderColor : S.border}`, borderRight: `2px solid ${i === 0 ? borderColor : S.border}`, borderBottom: `2px solid ${i === 0 ? borderColor : S.border}`,
                  borderLeft: `5px solid ${borderColor}`,
                  borderRadius: 3, padding: "10px 14px",
                  opacity: c.label === "SAČUVAJ" ? 0.55 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16 }}>{c.icon ?? "🎯"}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: S.white }}>
                      {CHIPS.find(x => x.id === c.chip)?.label ?? c.chip.toUpperCase()}
                    </span>
                    <span style={{ background: badgeBg + "22", border: `1px solid ${badgeBg}66`,
                      color: badgeBg, fontSize: 10, padding: "2px 8px", borderRadius: 2, fontWeight: 900 }}>
                      {c.label}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, fontFamily: "monospace",
                      color: S.muted }}>{c.score}/100</span>
                  </div>
                  <div style={{ fontSize: 13, color: S.silver }}>{c.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {prediction.analysis && (
        <div style={{ background: S.card, border: `2px solid ${S.border}`, borderRadius: 3, padding: "12px 14px" }}>
          <Label>AI analiza</Label>
          <p style={{ fontSize: 13, color: S.silver, lineHeight: 1.8, margin: 0 }}>{prediction.analysis}</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors">("drivers");

  if (!appState) return <Onboarding onFinish={s => { setAppState(s); setPrediction(null); }} />;

  // Fresh mode: immediately trigger prediction after onboarding
  const { mode, favoriteTeam, drivers, constructors, captain, usedChips, freeTransfers,
    remainingBudget, totalBudget, track } = appState;
  const T = getTheme(favoriteTeam ?? "ferrari");

  // Full-screen result view for BOTH modes
  if (prediction) {
    return <ResultView
      prediction={prediction}
      appState={appState}
      T={T}
      onReset={() => { setAppState(null); setPrediction(null); }}
    />;
  }

  const allDriverData = DRIVERS_2025.reduce((acc, d) => ({
    ...acc, [d.shortName]: { team: d.team, price: d.price, number: d.driverNumber,
      inTeam: drivers.includes(d.id) }
  }), {});
  const constructorData = CONSTRUCTORS_2025.reduce((acc, c) => ({
    ...acc, [c.id]: {
      name: c.name, price: c.price, inTeam: constructors.includes(c.id),
      drivers: c.drivers.map((dId: string) =>
        DRIVERS_2025.find(d => d.id === dId)?.shortName ?? dId.toUpperCase()
      ),
    }
  }), {});

  const handlePredict = async () => {
    setLoading(true); setError(null); setPrediction(null);
    try {
      const body = mode === "fresh"
        ? { mode: "fresh", track, allDriverData, constructorData,
            availableChips: CHIPS.filter(c => !usedChips.includes(c.id)).map(c => c.id),
            totalBudget }
        : { mode: "existing",
            team: {
              drivers: drivers.map(id => DRIVERS_2025.find(d => d.id === id)?.shortName ?? id),
              constructors, captain: DRIVERS_2025.find(d => d.id === captain)?.shortName ?? captain,
            },
            track, allDriverData, constructorData,
            availableChips: CHIPS.filter(c => !usedChips.includes(c.id)).map(c => c.id),
            activeChip, freeTransfers, remainingBudget };

      const res = await fetch("/api/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrediction(data);
    } catch (err: any) {
      setError(err.message ?? "Greška");
    } finally {
      setLoading(false);
    }
  };

  // Fresh mode loading/predict screen
  if (mode === "fresh" && !prediction) {
    return (
      <div style={{ minHeight: "100vh", background: S.bg, display: "flex",
        alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏎️</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: S.white, marginBottom: 8 }}>
            {track.name}
          </div>
          <div style={{ fontSize: 13, color: S.muted, marginBottom: 24, lineHeight: 1.8 }}>
            Budžet: <strong style={{ color: S.gold }}>${totalBudget}M</strong><br />
            Claude će predložiti optimalni tim 5 vozača + 2 konstruktora.
          </div>
          {error && (
            <div style={{ background: S.err + "18", border: `2px solid ${S.err}`, borderRadius: 3,
              padding: "10px 14px", fontSize: 13, color: S.err, marginBottom: 16 }}>
              ! {error}
            </div>
          )}
          <button onClick={handlePredict} disabled={loading} style={{
            background: loading ? S.border : `linear-gradient(135deg, ${S.gold}, #B8860B)`,
            border: "none", borderRadius: 4, padding: "14px 32px",
            color: loading ? S.muted : "#000",
            fontSize: 14, fontWeight: 900, letterSpacing: "0.12em",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", width: "100%",
          }}>
            {loading ? "🔄  ANALIZIRAM..." : "⚡  PREDLOŽI OPTIMALNI TIM"}
          </button>
          <button onClick={() => setAppState(null)} style={{
            background: "none", border: "none", color: S.muted, cursor: "pointer",
            fontSize: 12, marginTop: 12, fontFamily: "monospace",
          }}>← Natrag na početak</button>
        </div>
      </div>
    );
  }

  // Existing mode — full app
  const teamGroups = CONSTRUCTORS_2025.map(c => ({
    constructor: c, tDrivers: DRIVERS_2025.filter(d => d.team === c.id),
  }));

  return (
    <div style={{ minHeight: "100vh", color: S.text, fontFamily: "'Courier New', monospace",
      background: T.gradient, backgroundAttachment: "fixed" }}>
      <header style={{ borderBottom: `2px solid ${S.border}`, padding: "12px 20px",
        background: T.headerGradient, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${T.red}, ${S.gold}, ${T.red})` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Team mark */}
            <div style={{ width: 38, height: 38, flexShrink: 0, opacity: 0.9 }}>
              <svg viewBox={T.markViewBox} width="100%" height="100%"
                dangerouslySetInnerHTML={{ __html: T.mark }} />
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em",
                color: T.textOnPrimary === "#000000" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}>
                FANTASY · 2026 · {T.teamName.toUpperCase()}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900,
                color: T.textOnPrimary === "#000000" ? "#000" : "#fff",
                lineHeight: 1, letterSpacing: "0.06em" }}>PREDICTOR</div>
            </div>
          </div>
          <div style={{ background: S.card2, border: `2px solid ${T.red}88`,
            borderRadius: 4, padding: "6px 14px", textAlign: "center",
            backdropFilter: "blur(8px)", boxShadow: `0 0 16px ${T.glowColor}` }}>
            <div style={{ fontSize: 10, color: S.muted }}>💰 PREOSTALI BUDŽET</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: T.red, fontFamily: "monospace" }}>
              ${remainingBudget.toFixed(1)}M
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {drivers.map(id => {
              const d = DRIVERS_2025.find(x => x.id === id);
              if (!d) return null;
              return <span key={id} style={{ fontSize: 12, padding: "2px 7px", borderRadius: 2,
                fontWeight: 900, background: S.card2, color: S.white,
                borderTop: `2px solid ${id === captain ? T.red : tc(d.team)}`, borderRight: `2px solid ${id === captain ? T.red : tc(d.team)}`, borderBottom: `2px solid ${id === captain ? T.red : tc(d.team)}`,
                borderLeft: `4px solid ${tc(d.team)}` }}>
                {d.shortName}{id === captain ? "⚡" : ""}
              </span>;
            })}
            {constructors.map(id => {
              const c = CONSTRUCTORS_2025.find(x => x.id === id);
              if (!c) return null;
              return <span key={id} style={{ fontSize: 12, padding: "2px 7px", borderRadius: 2,
                background: S.card2, color: S.silver,
                borderTop: `1px solid ${S.border}`, borderRight: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`, borderLeft: `4px solid ${tc(id)}` }}>
                {c.shortName}
              </span>;
            })}
            <button onClick={() => { setAppState(null); setPrediction(null); }} style={{
              background: "none", border: `1px solid ${S.border}`, borderRadius: 2,
              color: S.muted, padding: "3px 9px", cursor: "pointer",
              fontSize: 11, fontFamily: "monospace",
            }}>↺ RESET</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px",
        display: "grid", gridTemplateColumns: "1fr 380px", gap: 18 }}>
        <div>
          {/* Track */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "12px 16px", marginBottom: 12,
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            boxShadow: `0 4px 24px ${T.glowColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ background: T.red, padding: "2px 8px", borderRadius: 2,
                fontSize: 11, fontWeight: 900, color: "#fff" }}>R{track.round}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: S.white }}>{track.name}</div>
              {track.isSprint && <Pill color="#FF8000" icon="⚡">SPRINT</Pill>}
              {track.circuitType === "street" && <Pill color={S.blue} icon="🏙">STREET</Pill>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={track.id} onChange={e => {
                const t = TRACKS_2025.find(x => x.id === e.target.value);
                if (t) setAppState(prev => prev ? { ...prev, track: t } : prev);
              }} style={{ background: S.card2, border: `2px solid ${S.border}`, color: S.text,
                padding: "7px 10px", borderRadius: 3, fontSize: 13, fontFamily: "monospace", flex: 1 }}>
                {TRACKS_2025.map(t => (
                  <option key={t.id} value={t.id}>R{t.round} · {t.name}{t.isSprint ? " ⚡" : ""}</option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: S.muted }}>{track.date}</div>
            </div>
          </div>

          {/* Chipovi */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "12px 16px", marginBottom: 12,
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            boxShadow: `0 4px 24px ${T.glowColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
              <Label>Chipovi — samo 1 po vikendu</Label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {activeChip && (
                  <span style={{ background: S.blue + "22", border: `1px solid ${S.blue}66`,
                    color: S.blue, fontSize: 11, padding: "2px 8px", borderRadius: 2, fontWeight: 900 }}>
                    ✓ {CHIPS.find(c => c.id === activeChip)?.icon} {CHIPS.find(c => c.id === activeChip)?.label} AKTIVAN
                  </span>
                )}
                <span style={{ fontSize: 12, color: S.silver, fontFamily: "monospace" }}>
                  Transferi: <strong style={{ color: S.white }}>{freeTransfers} bespl.</strong>
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5 }}>
              {CHIPS.map(chip => {
                const used = usedChips.includes(chip.id);
                const isActive = activeChip === chip.id;
                return (
                  <div key={chip.id} title={chip.desc}
                    onClick={() => !used && setActiveChip(prev => prev === chip.id ? null : chip.id)}
                    style={{
                      background: isActive ? S.blue + "18" : S.card2,
                      border: `2px solid ${isActive ? T.red : T.border}`,
                      borderRadius: 3, padding: "7px 4px",
                      cursor: used ? "default" : "pointer",
                      textAlign: "center", opacity: used ? 0.2 : 1,
                    }}>
                    <div style={{ fontSize: 15 }}>{chip.icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 900,
                      color: isActive ? S.blue : S.silver, marginTop: 1 }}>{chip.label}</div>
                    {isActive && <div style={{ fontSize: 9, color: S.blue }}>✓ AKTIVAN</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `2px solid ${S.border}`, marginBottom: 10 }}>
            {[
              { id: "drivers" as const, label: `VOZAČI  ${drivers.length}/5` },
              { id: "constructors" as const, label: `KONSTRUKTORI  ${constructors.length}/2` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: "none", border: "none",
                borderBottom: activeTab === t.id ? `3px solid ${T.red}` : "3px solid transparent",
                color: activeTab === t.id ? S.white : S.muted,
                padding: "8px 16px", cursor: "pointer",
                fontSize: 11, letterSpacing: "0.18em", fontFamily: "monospace", fontWeight: 700,
              }}>{t.label}</button>
            ))}
          </div>

          {activeTab === "drivers" && teamGroups.map(({ constructor: c, tDrivers }) => (
            <div key={c.id} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: tc(c.id),
                marginBottom: 5, fontWeight: 900 }}>▌ {c.name.toUpperCase()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {tDrivers.map(d => (
                  <DriverCard key={d.id} driver={d}
                    selected={drivers.includes(d.id)}
                    isCaptain={captain === d.id}
                    onToggle={() => setAppState(prev => {
                      if (!prev) return prev;
                      const sel = prev.drivers.includes(d.id)
                        ? prev.drivers.filter(x => x !== d.id)
                        : prev.drivers.length < 5 ? [...prev.drivers, d.id] : prev.drivers;
                      return { ...prev, drivers: sel,
                        captain: prev.drivers.includes(d.id) && prev.captain === d.id ? "" : prev.captain };
                    })}
                    onSetCaptain={() => setAppState(prev => prev ? { ...prev, captain: d.id } : prev)}
                  />
                ))}
              </div>
            </div>
          ))}

          {activeTab === "constructors" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7 }}>
              {CONSTRUCTORS_2025.map(c => (
                <ConstructorCard key={c.id} constructor={c}
                  selected={constructors.includes(c.id)}
                  onToggle={() => setAppState(prev => {
                    if (!prev) return prev;
                    const sel = prev.constructors.includes(c.id)
                      ? prev.constructors.filter(x => x !== c.id)
                      : prev.constructors.length < 2 ? [...prev.constructors, c.id] : prev.constructors;
                    return { ...prev, constructors: sel };
                  })}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={handlePredict} disabled={loading} style={{
            background: loading ? S.border : `linear-gradient(135deg, ${T.red}, ${T.red}88)`,
            border: `2px solid ${loading ? T.border : T.red}`,
            borderRadius: 4, padding: "15px 0", color: "#fff",
            fontSize: 14, fontWeight: 900, letterSpacing: "0.12em",
            textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "monospace", width: "100%",
            boxShadow: loading ? "none" : `0 4px 24px ${T.red}88, 0 0 40px ${T.red}33`,
          }}>
            {loading ? "🔄  ANALIZIRAM..." : `⚡  PREDVIDI · ${track.name.replace(" GP", "")}`}
          </button>

          {error && (
            <div style={{ background: S.err + "18", border: `2px solid ${S.err}66`,
              borderRadius: 3, padding: "10px 14px", fontSize: 13, color: S.err }}>
              <strong>! GREŠKA:</strong> {error}
            </div>
          )}

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "12px 14px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            boxShadow: `0 2px 16px ${T.glowColor}` }}>
            <Label>Status tima</Label>
            {[
              { ok: drivers.length === 5, label: "Vozači", okLabel: "5/5", failLabel: `${drivers.length}/5` },
              { ok: constructors.length === 2, label: "Konstruktori", okLabel: "2/2", failLabel: `${constructors.length}/2` },
              { ok: !!captain, label: "DRS Boost",
                okLabel: DRIVERS_2025.find(d => d.id === captain)?.shortName ?? "OK",
                failLabel: "NIJE ODABRAN" },
              { ok: true, label: "Budžet za transf.", okLabel: `$${remainingBudget.toFixed(1)}M`, failLabel: "—" },
            ].map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 7, gap: 8 }}>
                <span style={{ fontSize: 13, color: S.silver }}>{v.label}</span>
                <StatusBadge ok={v.ok} okLabel={v.okLabel} failLabel={v.failLabel} />
              </div>
            ))}
          </div>

          {prediction
            ? <PredictionPanel prediction={prediction} drivers={drivers} constructors={constructors} captain={captain} />
            : !loading && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 6, padding: "32px 16px", textAlign: "center",
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                boxShadow: `0 4px 24px ${T.glowColor}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏎️</div>
                <div style={{ fontSize: 12, color: S.muted, lineHeight: 2 }}>
                  TIM UČITAN · ${remainingBudget.toFixed(1)}M<br />
                  Klikni PREDVIDI za AI analizu.
                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}
