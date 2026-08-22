import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from "react";
import {
  Plus, Settings, BarChart3, CalendarDays, Home, Check, Flame, ChevronLeft, ChevronRight,
  Pencil, Trash2, Archive, RotateCcw, Bell, Target, TrendingUp, Award, Sparkles,
  Circle, Footprints, BookOpen, Droplets, Dumbbell, Languages, Brain, Music, Bike, Coffee,
  Heart, Leaf, Moon, Sun, Apple, Palette, Code, Camera, PenLine, Utensils, Smile, Zap, Star,
  Download, Clock, Minus, Repeat, ChevronDown
} from "lucide-react";

/* ============================================================================
   HabitFlow — "Build habits. Flow every day."
   The mark is three progress bars on black — the product metaphor, stated in the
   icon. The wordmark's underline doubles as the daily progress bar: clear every
   habit and it completes into the lockup.
   ========================================================================== */

/* ---------------------------------------------------------------- theming */

/* Brand — sampled from the HabitFlow mark. The icon's three rows and the
   underline beneath the wordmark drive every accent in the app. */
const BRAND = {
  blue:  "#0F86FB",
  amber: "#F8B622",
  green: "#07C376",
  grey:  "#9D9DA0",
};

/* The app icon: three progress bars on black, measured off the supplied mark.
   Geometry is in 64-unit tile space. Bar height is exactly 2R, so the caps are
   true semicircles, and each fill keeps a square right edge inside its rounded
   track — which is why the fill is clipped rather than drawn rounded. */
const ICON = {
  bg: "#000000",
  x: 9.6, w: 44.8, h: 11.9, r: 5.95, radius: 15,
  bars: [
    { cy: 15.50, fill: "#68CE68", track: "#304033", value: 0.414 },
    { cy: 32.05, fill: "#3B82F4", track: "#293647", value: 0.844 },
    { cy: 48.60, fill: "#EB5546", track: "#442F2E", value: 0.624 },
  ],
};

/* The underline splits 40 / 19 / 41 — kept exactly, so a finished day
   reproduces the lockup rather than an even three-way split. */
const LOGO_BAR = [
  { w: 0.40, color: BRAND.blue },
  { w: 0.19, color: BRAND.amber },
  { w: 0.41, color: BRAND.green },
];

const TAGLINE = "Build habits. Flow every day.";

const THEMES = {
  charcoal: { id: "charcoal", label: "Charcoal", bg: "#0B0C0F", card: "#141417", alt: "#1A1A1F", empty: "#212126", nav: "rgba(11,12,15,0.86)" },
  black:    { id: "black",    label: "True black", bg: "#000000", card: "#0C0C0E", alt: "#141417", empty: "#1C1C20", nav: "rgba(0,0,0,0.86)" },
  slate:    { id: "slate",    label: "Slate",     bg: "#0D1014", card: "#161A20", alt: "#1D222A", empty: "#252B34", nav: "rgba(13,16,20,0.86)" },
};

const BASE = {
  t1: "#F2F2F5",
  t2: "#8B8B93",
  t3: "#56565E",
  line: "rgba(255,255,255,0.075)",
  soft: "rgba(255,255,255,0.045)",
};

const ThemeCtx = createContext({ ...THEMES.charcoal, ...BASE });
const useC = () => useContext(ThemeCtx);

const ACCENTS = {
  green:  { label: "Green",  hex: BRAND.green },
  purple: { label: "Purple", hex: "#A78BFA" },
  red:    { label: "Red",    hex: "#FF6161" },
  orange: { label: "Orange", hex: "#FF9F40" },
  blue:   { label: "Blue",   hex: BRAND.blue },
  teal:   { label: "Teal",   hex: "#2DD4BF" },
  pink:   { label: "Pink",   hex: "#FF71B8" },
  amber:  { label: "Amber",  hex: BRAND.amber },
};
const accent = (k) => (ACCENTS[k] || ACCENTS.green).hex;

const hexA = (hex, a) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/* ------------------------------------------------------------------ icons */

const ICONS = {
  footprints: Footprints, book: BookOpen, droplet: Droplets, dumbbell: Dumbbell,
  languages: Languages, brain: Brain, music: Music, bike: Bike, coffee: Coffee,
  heart: Heart, leaf: Leaf, moon: Moon, sun: Sun, apple: Apple, palette: Palette,
  code: Code, camera: Camera, pen: PenLine, utensils: Utensils, smile: Smile,
  zap: Zap, star: Star, target: Target, sparkles: Sparkles, clock: Clock, flame: Flame,
};
const ICON_KEYS = Object.keys(ICONS);
const Glyph = ({ name, ...p }) => { const I = ICONS[name] || Circle; return <I {...p} />; };

/* ------------------------------------------------------------- date utils */

const pad = (n) => String(n).padStart(2, "0");
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d, ws) => addDays(d, -(((startOfDay(d).getDay() - ws) % 7) + 7) % 7);
const sameDay = (a, b) => +startOfDay(a) === +startOfDay(b);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function relativeLabel(key) {
  const d = fromKey(key), today = startOfDay(new Date());
  const diff = Math.round((+today - +d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return DAYS_FULL[d.getDay()];
  return `${MON_ABBR[d.getMonth()]} ${d.getDate()}`;
}

/* --------------------------------------------------------- habit maths */

const goalOf = (h) => Math.max(1, h.goal || 1);
const countOn = (h, key) => h.completions[key] || 0;
const isDone = (h, key) => countOn(h, key) >= goalOf(h);

function isScheduled(freq, d) {
  if (!freq || freq.type === "daily") return true;
  if (freq.type === "weekdays") return (freq.days || []).includes(d.getDay());
  return true; // "weekly" habits can be done on any day
}

function countInWeek(h, weekStart) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (isDone(h, toKey(addDays(weekStart, i)))) n++;
  return n;
}

/**
 * Reduces a habit into a flat list of scoring units, oldest first.
 * Daily / weekday habits score per scheduled day; weekly habits score per week.
 * Everything downstream (streaks, percentages, consistency) reads this one shape.
 */
function buildUnits(h, weekStart) {
  const today = startOfDay(new Date());
  let cursor = fromKey(h.createdAt);
  const floor = addDays(today, -1095);
  if (cursor < floor) cursor = floor;
  const units = [];

  if (h.frequency?.type === "weekly") {
    let ws = startOfWeek(cursor, weekStart);
    const cw = startOfWeek(today, weekStart);
    let guard = 0;
    while (ws <= cw && guard++ < 600) {
      units.push({ done: countInWeek(h, ws) >= (h.frequency.times || 3), current: +ws === +cw });
      ws = addDays(ws, 7);
    }
  } else {
    let d = cursor, guard = 0;
    while (d <= today && guard++ < 1200) {
      if (isScheduled(h.frequency, d)) units.push({ done: isDone(h, toKey(d)), current: +d === +today });
      d = addDays(d, 1);
    }
  }
  return units;
}

function currentStreak(units) {
  let i = units.length - 1;
  if (i >= 0 && units[i].current && !units[i].done) i--; // today still has time left
  let s = 0;
  while (i >= 0 && units[i].done) { s++; i--; }
  return s;
}

function longestStreak(units) {
  let best = 0, run = 0;
  for (const u of units) { if (u.done) { run++; if (run > best) best = run; } else run = 0; }
  return best;
}

function habitStats(h, weekStart) {
  const units = buildUnits(h, weekStart);
  const total = units.length || 1;
  const met = units.filter((u) => u.done).length;
  const completions = Object.keys(h.completions).filter((k) => isDone(h, k)).length;
  return {
    units,
    current: currentStreak(units),
    longest: longestStreak(units),
    percent: Math.round((met / total) * 100),
    completions,
    unitWord: h.frequency?.type === "weekly" ? "week" : "day",
  };
}

/* ------------------------------------------------------------- seed data */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_DEFS = [
  { name: "Walk Around the Block", desc: "15 minutes outside, rain or shine", icon: "footprints", color: "green",  days: 214, density: 0.86, goal: 1, streak: 12, freq: { type: "daily" }, today: 1 },
  { name: "Read for 20 Minutes",   desc: "Fiction before bed, phone in the kitchen", icon: "book", color: "purple", days: 186, density: 0.71, goal: 1, streak: 6,  freq: { type: "daily" }, today: 1 },
  { name: "Drink Water",           desc: "Eight glasses across the day", icon: "droplet", color: "blue",   days: 201, density: 0.9,  goal: 8, streak: 21, freq: { type: "daily" }, today: 5 },
  { name: "Exercise",              desc: "Strength Mon/Tue, ride Thu/Fri", icon: "dumbbell", color: "red",  days: 163, density: 0.66, goal: 1, streak: 3,  freq: { type: "weekdays", days: [1, 2, 4, 5] }, today: 0 },
  { name: "Learn a Language",      desc: "Ten minutes of Spanish on the train", icon: "languages", color: "orange", days: 142, density: 0.68, goal: 1, streak: 9, freq: { type: "daily" }, today: 1 },
  { name: "Meditation",            desc: "Morning stillness, ten slow breaths", icon: "brain", color: "teal", days: 190, density: 0.78, goal: 1, streak: 15, freq: { type: "daily" }, today: 1 },
  { name: "Practice a Skill",      desc: "Guitar — scales, then one song", icon: "music", color: "pink",  days: 121, density: 0.52, goal: 1, streak: 0,  freq: { type: "weekly", times: 4 }, today: 0 },
];

function seedState() {
  const rnd = mulberry32(20260818);
  const today = startOfDay(new Date());

  const habits = SEED_DEFS.map((def, i) => {
    const completions = {};
    for (let back = def.days; back >= 0; back--) {
      const d = addDays(today, -back);
      if (!isScheduled(def.freq, d)) continue;

      if (back === 0) { if (def.today > 0) completions[toKey(d)] = def.today; continue; }

      let p = def.density;
      if (d.getDay() === 0 || d.getDay() === 6) p *= 0.86;
      if (back < def.streak) p = 1;          // a clean run leading into today
      if (back > def.days - 25) p *= 0.55;   // shaky at the very beginning

      if (rnd() < p) {
        // multi-count habits get some part-done days for texture, but never inside a streak
        const partial = def.goal > 1 && back >= def.streak && rnd() > 0.78;
        completions[toKey(d)] = def.goal > 1 ? (partial ? Math.max(2, def.goal - 3) : def.goal) : 1;
      }
    }
    return {
      id: `h_${i}_${def.icon}`,
      name: def.name,
      description: def.desc,
      icon: def.icon,
      color: def.color,
      goal: def.goal,
      frequency: def.freq,
      reminder: { enabled: i % 2 === 0, time: i % 2 === 0 ? "08:30" : "20:00" },
      createdAt: toKey(addDays(today, -def.days)),
      archived: false,
      completions,
    };
  });

  return {
    version: 1,
    habits,
    settings: { theme: "charcoal", weekStart: 1, notifications: true, reminderTime: "20:00", reduceMotion: false, showDescriptions: true },
  };
}

const emptyState = () => ({
  version: 1,
  habits: [],
  settings: { theme: "charcoal", weekStart: 1, notifications: true, reminderTime: "20:00", reduceMotion: false, showDescriptions: true },
});

/* ============================================================================
   Primitives
   ========================================================================== */

function useReveal(open, ms = 300) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted, shown };
}

function useCountUp(target, ms = 620) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current, start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (target - from) * eased);
      setV(next); ref.current = next;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Switch({ checked, onChange, tint }) {
  const C = useC();
  const on = tint || ACCENTS.green.hex;
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0"
      style={{
        width: 48, height: 29, borderRadius: 999,
        background: checked ? on : "rgba(255,255,255,0.10)",
        transition: "background .24s cubic-bezier(.2,.8,.2,1)",
        border: `1px solid ${checked ? hexA(on, 0.4) : C.line}`,
      }}
    >
      <span
        style={{
          position: "absolute", top: 2, left: checked ? 21 : 2, width: 23, height: 23,
          borderRadius: 999, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.45)",
          transition: "left .24s cubic-bezier(.3,1.4,.5,1)",
        }}
      />
    </button>
  );
}

function IconBtn({ icon: I, onClick, label, size = 36, tone = "ghost", tint }) {
  const C = useC();
  const solid = tone === "solid";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="hk-press flex items-center justify-center"
      style={{
        width: size, height: size, borderRadius: size <= 34 ? 11 : 12,
        background: solid ? (tint || "#F2F2F5") : "rgba(255,255,255,0.055)",
        border: `1px solid ${solid ? "transparent" : C.line}`,
        color: solid ? "#0B0B0D" : C.t2,
      }}
    >
      <I size={size <= 34 ? 16 : 18} strokeWidth={2.2} />
    </button>
  );
}

function Segmented({ value, onChange, options }) {
  const C = useC();
  return (
    <div className="flex gap-1" style={{ background: "rgba(255,255,255,0.045)", border: `1px solid ${C.line}`, borderRadius: 13, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex-1 hk-press"
            style={{
              padding: "8px 6px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              letterSpacing: -0.1,
              color: on ? "#0B0B0D" : C.t2,
              background: on ? "#F2F2F5" : "transparent",
              transition: "background .2s, color .2s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }) {
  const C = useC();
  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 9 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.t2, letterSpacing: 0.2, textTransform: "uppercase" }}>{label}</label>
        {hint && <span style={{ fontSize: 11.5, color: C.t3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength = 60 }) {
  const C = useC();
  const [focus, setFocus] = useState(false);
  return (
    <input
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: "100%", padding: "13px 14px", borderRadius: 14, fontSize: 15,
        background: C.alt, color: C.t1,
        border: `1px solid ${focus ? "rgba(255,255,255,0.22)" : C.line}`,
        transition: "border-color .18s",
      }}
    />
  );
}

function Stepper({ value, onChange, min = 1, max = 30, suffix }) {
  const C = useC();
  const btn = (icon, delta, disabled) => (
    <button
      onClick={() => !disabled && onChange(Math.min(max, Math.max(min, value + delta)))}
      className="hk-press flex items-center justify-center"
      style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.06)", color: disabled ? C.t3 : C.t1, opacity: disabled ? 0.4 : 1 }}
      aria-label={delta > 0 ? "Increase" : "Decrease"}
    >
      {icon}
    </button>
  );
  return (
    <div className="flex items-center justify-between" style={{ background: C.alt, border: `1px solid ${C.line}`, borderRadius: 14, padding: 5 }}>
      {btn(<Minus size={16} strokeWidth={2.6} />, -1, value <= min)}
      <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {value}<span style={{ color: C.t2, fontWeight: 500 }}> {suffix}</span>
      </div>
      {btn(<Plus size={16} strokeWidth={2.6} />, 1, value >= max)}
    </div>
  );
}

function Row({ icon: I, label, value, onClick, right, tint, last }) {
  const C = useC();
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left"
      style={{ padding: "13px 14px", borderBottom: last ? "none" : `1px solid ${C.soft}` }}
    >
      {I && (
        <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: hexA(tint || "#8B8B93", 0.14), color: tint || C.t2 }}>
          <I size={15} strokeWidth={2.2} />
        </div>
      )}
      <span className="flex-1" style={{ fontSize: 14.5, color: C.t1 }}>{label}</span>
      {value != null && <span style={{ fontSize: 14, color: C.t2 }}>{value}</span>}
      {right}
      {onClick && !right && <ChevronRight size={16} style={{ color: C.t3 }} />}
    </Tag>
  );
}

function Card({ children, style, className = "", onClick }) {
  const C = useC();
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={className}
      style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, width: "100%", textAlign: "left", ...style }}
    >
      {children}
    </Tag>
  );
}

function SectionTitle({ children, trailing }) {
  const C = useC();
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 10, paddingLeft: 2 }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: C.t2, letterSpacing: 0.6, textTransform: "uppercase" }}>{children}</h2>
      {trailing}
    </div>
  );
}

/* ============================================================================
   The activity grid — the signature element
   ========================================================================== */

function ActivityGrid({ habit, weeks = 20, weekStart = 1, radius = 3.5, gap = 3, onPick, pulseKey, showMonths = false }) {
  const C = useC();
  const tint = accent(habit.color);
  const today = startOfDay(new Date());
  const created = fromKey(habit.createdAt);

  const { cells, columns } = useMemo(() => {
    const end = addDays(startOfWeek(today, weekStart), 6);
    const start = addDays(end, -(weeks * 7 - 1));
    const list = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        list.push({ date, key: toKey(date), col: w, row: d });
      }
    }
    return { cells: list, columns: weeks };
  }, [weeks, weekStart, habit.id, +today]);

  const monthMarks = useMemo(() => {
    if (!showMonths) return [];
    const marks = [];
    let seen = -1;
    for (let w = 0; w < columns; w++) {
      const first = cells[w * 7]?.date;
      if (!first) continue;
      if (first.getMonth() !== seen && first.getDate() <= 7) { marks.push({ col: w, label: MON_ABBR[first.getMonth()] }); seen = first.getMonth(); }
    }
    return marks;
  }, [cells, columns, showMonths]);

  return (
    <div>
      {showMonths && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap, marginBottom: 5 }}>
          {Array.from({ length: columns }).map((_, w) => {
            const m = monthMarks.find((x) => x.col === w);
            return <div key={w} style={{ fontSize: 9, color: C.t3, fontWeight: 600, whiteSpace: "nowrap" }}>{m ? m.label : ""}</div>;
          })}
        </div>
      )}
      <div
        style={{
          display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column",
          gridAutoColumns: "1fr", gap,
        }}
      >
        {cells.map((c) => {
          const future = c.date > today;
          const before = c.date < created;
          const n = countOn(habit, c.key);
          const g = goalOf(habit);
          const ratio = Math.min(1, n / g);
          const scheduled = isScheduled(habit.frequency, c.date);
          const isToday = sameDay(c.date, today);

          let bg = C.empty;
          if (future || before) bg = hexA("#FFFFFF", 0.018);
          else if (n > 0) bg = hexA(tint, 0.3 + 0.7 * ratio);
          else if (!scheduled) bg = hexA("#FFFFFF", 0.028);

          const pulsing = pulseKey && isToday && n > 0;
          const interactive = onPick && !future;

          return (
            <div
              key={c.key}
              onClick={interactive ? () => onPick(c.key) : undefined}
              role={interactive ? "button" : undefined}
              aria-label={interactive ? c.key : undefined}
              style={{
                aspectRatio: "1 / 1", borderRadius: radius, background: bg,
                cursor: interactive ? "pointer" : "default",
                boxShadow: isToday && !future ? `0 0 0 1.4px ${n > 0 ? hexA(tint, 0.85) : "rgba(255,255,255,0.28)"}` : "none",
                transition: "background .28s ease",
                animation: pulsing ? "hk-cell .42s cubic-bezier(.3,1.5,.5,1)" : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ mini charts */

function BarChart({ data, tint, height = 92 }) {
  const C = useC();
  const w = 300, gap = 5;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = Math.max(3, d.value * height);
          return (
            <g key={i}>
              <rect x={i * (bw + gap)} y={0} width={bw} height={height} rx={3} fill="rgba(255,255,255,0.035)" />
              <rect x={i * (bw + gap)} y={height - h} width={bw} height={h} rx={3} fill={d.value > 0 ? hexA(tint, 0.35 + 0.65 * d.value) : "transparent"}>
                <animate attributeName="height" from="0" to={h} dur="0.55s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" />
                <animate attributeName="y" from={height} to={height - h} dur="0.55s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" />
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="flex" style={{ marginTop: 7 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center" style={{ fontSize: 9.5, color: C.t3, fontWeight: 600 }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function AreaChart({ values, tint, height = 96 }) {
  const w = 300, padY = 8;
  const pts = values.map((v, i) => ({
    x: (i / Math.max(1, values.length - 1)) * w,
    y: padY + (1 - v) * (height - padY * 2),
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${w} ${height} L 0 ${height} Z`;
  const id = `g${tint.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(tint, 0.28)} />
          <stop offset="100%" stopColor={hexA(tint, 0)} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={w} y1={padY + g * (height - padY * 2)} y2={padY + g * (height - padY * 2)} stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={tint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 1200, strokeDashoffset: 0, animation: "hk-draw 1.1s cubic-bezier(.2,.8,.2,1) both" }} />
    </svg>
  );
}

function Ring({ value, size = 78, stroke = 7, tint, children }) {
  const C = useC();
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tint} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value)}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: C.t1 }}>{children}</div>
    </div>
  );
}

/* ============================================================================
   Habit card
   ========================================================================== */

function CompleteButton({ habit, onToggle, pulse }) {
  const C = useC();
  const tint = accent(habit.color);
  const key = toKey(new Date());
  const n = countOn(habit, key), g = goalOf(habit);
  const done = n >= g;
  const ratio = Math.min(1, n / g);
  const size = 42, r = 18.5, circ = 2 * Math.PI * r;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-label={done ? `Mark ${habit.name} not done` : `Mark ${habit.name} done`}
      className="relative flex items-center justify-center shrink-0"
      style={{ width: 48, height: 48, marginRight: -3 }}
    >
      {pulse && (
        <span style={{ position: "absolute", width: size, height: size, borderRadius: 999, border: `2px solid ${tint}`, animation: "hk-ring .62s cubic-bezier(.2,.8,.2,1)" }} />
      )}
      <span
        className="flex items-center justify-center"
        style={{
          width: size, height: size, borderRadius: 999,
          background: done ? tint : "rgba(255,255,255,0.045)",
          border: `1.5px solid ${done ? tint : C.line}`,
          color: done ? "#0B0B0D" : C.t3,
          transition: "background .26s, border-color .26s, color .26s",
          animation: pulse ? "hk-pop .46s cubic-bezier(.3,1.5,.5,1)" : undefined,
        }}
      >
        {g > 1 && !done ? (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: n > 0 ? tint : C.t3, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        ) : (
          <Check size={20} strokeWidth={3} />
        )}
      </span>
      {g > 1 && !done && (
        <svg width={size + 6} height={size + 6} style={{ position: "absolute", transform: "rotate(-90deg)", pointerEvents: "none" }}>
          <circle cx={(size + 6) / 2} cy={(size + 6) / 2} r={r + 2} fill="none" stroke={hexA(tint, 0.9)} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (r + 2)} strokeDashoffset={2 * Math.PI * (r + 2) * (1 - ratio)}
            style={{ transition: "stroke-dashoffset .4s cubic-bezier(.2,.8,.2,1)" }} />
        </svg>
      )}
    </button>
  );
}

function HabitCard({ habit, stats, weekStart, onOpen, onToggle, pulse, showDescription, index }) {
  const C = useC();
  const tint = accent(habit.color);
  const g = goalOf(habit);
  const n = countOn(habit, toKey(new Date()));

  return (
    <div
      onClick={onOpen}
      className="hk-press hk-in"
      style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 22,
        padding: 15, cursor: "pointer", animationDelay: `${Math.min(index, 8) * 45}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 38, height: 38, borderRadius: 12, background: hexA(tint, 0.15), color: tint, border: `1px solid ${hexA(tint, 0.18)}` }}
        >
          <Glyph name={habit.icon} size={19} strokeWidth={2.1} />
        </div>

        <div className="flex-1" style={{ minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 650, letterSpacing: -0.25, color: C.t1, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {habit.name}
          </div>
          {showDescription && habit.description && (
            <div style={{ fontSize: 12.5, color: C.t2, marginTop: 2, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {habit.description}
            </div>
          )}
        </div>

        <CompleteButton habit={habit} onToggle={onToggle} pulse={pulse} />
      </div>

      <div style={{ marginTop: 14 }}>
        <ActivityGrid habit={habit} weeks={20} weekStart={weekStart} pulseKey={pulse} />
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 13 }}>
        <div className="flex items-center gap-1" style={{ color: stats.current > 0 ? tint : C.t3 }}>
          <Flame size={14} strokeWidth={2.4} fill={stats.current > 0 ? tint : "none"} />
          <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {stats.current > 0 ? `${stats.current} ${stats.unitWord}${stats.current === 1 ? "" : "s"}` : "No streak"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {g > 1 && <span style={{ fontSize: 12, color: C.t3, fontVariantNumeric: "tabular-nums" }}>{n}/{g} today</span>}
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{stats.percent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Sheet / overlay shells
   ========================================================================== */

/**
 * Overlays are fixed to the same centred column as the app rather than nested
 * inside it, so a scrolling parent can never clip them.
 */
const SHELL = { position: "fixed", top: 0, bottom: 0, left: "50%", width: "100%", maxWidth: 440, transform: "translateX(-50%)" };

function Sheet({ open, onClose, children, title, action }) {
  const C = useC();
  const { mounted, shown } = useReveal(open, 300);
  if (!mounted) return null;
  return (
    <div className="flex flex-col justify-end" style={{ ...SHELL, zIndex: 60 }}>
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(3px)", opacity: shown ? 1 : 0, transition: "opacity .28s" }}
      />
      <div
        className="relative flex flex-col hk-scroll"
        style={{
          background: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderTop: `1px solid ${C.line}`, maxHeight: "94%",
          transform: shown ? "translateY(0)" : "translateY(102%)",
          transition: "transform .34s cubic-bezier(.2,.85,.25,1)",
        }}
      >
        <div className="flex items-center justify-center" style={{ paddingTop: 9 }}>
          <div style={{ width: 34, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.16)" }} />
        </div>
        <div className="flex items-center justify-between" style={{ padding: "12px 16px 12px" }}>
          <button onClick={onClose} style={{ fontSize: 14.5, color: C.t2 }}>Cancel</button>
          <div style={{ fontSize: 15.5, fontWeight: 650, letterSpacing: -0.2 }}>{title}</div>
          <div style={{ minWidth: 48, textAlign: "right" }}>{action}</div>
        </div>
        <div className="flex-1 hk-scroll" style={{ overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function PushScreen({ open, children }) {
  const C = useC();
  const { mounted, shown } = useReveal(open, 300);
  if (!mounted) return null;
  return (
    <div style={{ ...SHELL, zIndex: 50, overflow: "hidden", pointerEvents: shown ? "auto" : "none" }}>
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          background: C.bg,
          transform: shown ? "translateX(0)" : "translateX(100%)",
          transition: "transform .32s cubic-bezier(.2,.85,.25,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================================
   Add / edit habit
   ========================================================================== */

const blankDraft = (reminderTime) => ({
  name: "", description: "", icon: "sparkles", color: "blue",
  goal: 1, frequency: { type: "daily" },
  reminder: { enabled: false, time: reminderTime || "20:00" },
});

function AddHabitSheet({ open, onClose, onSave, editing, defaults }) {
  const C = useC();
  const [d, setD] = useState(blankDraft(defaults.reminderTime));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTouched(false);
      setD(editing
        ? { name: editing.name, description: editing.description, icon: editing.icon, color: editing.color, goal: editing.goal || 1, frequency: editing.frequency || { type: "daily" }, reminder: editing.reminder || { enabled: false, time: "20:00" } }
        : blankDraft(defaults.reminderTime));
    }
  }, [open, editing]);

  const tint = accent(d.color);
  const valid = d.name.trim().length > 0;
  const set = (patch) => setD((x) => ({ ...x, ...patch }));

  const save = () => {
    if (!valid) { setTouched(true); return; }
    onSave({ ...d, name: d.name.trim(), description: d.description.trim() });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit habit" : "New habit"}
      action={<button onClick={save} style={{ fontSize: 14.5, fontWeight: 650, color: valid ? tint : C.t3 }}>Save</button>}
    >
      <div style={{ padding: "4px 16px 28px" }} className="flex flex-col gap-5">

        {/* live preview — the card you're about to make */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 14 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0" style={{ width: 38, height: 38, borderRadius: 12, background: hexA(tint, 0.15), color: tint, border: `1px solid ${hexA(tint, 0.18)}`, transition: "background .25s, color .25s" }}>
              <Glyph name={d.icon} size={19} strokeWidth={2.1} />
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: -0.2, color: d.name ? C.t1 : C.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d.name || "Name your habit"}
              </div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {d.description || "Add a short reminder of why"}
              </div>
            </div>
            <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 999, background: hexA(tint, 0.16), color: tint }}>
              <Check size={18} strokeWidth={3} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 3 }}>
            {Array.from({ length: 140 }).map((_, i) => {
              const on = mulberry32(i * 977 + 13)() < 0.55;
              return <div key={i} style={{ aspectRatio: "1 / 1", borderRadius: 3.5, background: on ? hexA(tint, 0.3 + 0.6 * mulberry32(i * 31 + 7)()) : C.empty, transition: "background .3s" }} />;
            })}
          </div>
        </div>

        <Field label="Name" hint={touched && !valid ? "Required" : undefined}>
          <TextInput value={d.name} onChange={(v) => set({ name: v })} placeholder="Walk around the block" maxLength={42} />
        </Field>

        <Field label="Description" hint="Optional">
          <TextInput value={d.description} onChange={(v) => set({ description: v })} placeholder="15 minutes outside, rain or shine" maxLength={70} />
        </Field>

        <Field label="Icon">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {ICON_KEYS.map((k) => {
              const on = k === d.icon;
              return (
                <button
                  key={k}
                  onClick={() => set({ icon: k })}
                  className="hk-press flex items-center justify-center"
                  style={{
                    aspectRatio: "1 / 1", borderRadius: 12,
                    background: on ? hexA(tint, 0.18) : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? hexA(tint, 0.55) : C.line}`,
                    color: on ? tint : C.t2, transition: "all .18s",
                  }}
                >
                  <Glyph name={k} size={17} strokeWidth={2.1} />
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Colour">
          <div className="flex items-center justify-between">
            {Object.entries(ACCENTS).map(([k, v]) => {
              const on = k === d.color;
              return (
                <button
                  key={k}
                  onClick={() => set({ color: k })}
                  className="hk-press flex items-center justify-center"
                  aria-label={v.label}
                  style={{ width: 36, height: 36, borderRadius: 999, background: hexA(v.hex, on ? 1 : 0.9), boxShadow: on ? `0 0 0 2.5px ${C.bg}, 0 0 0 4.5px ${v.hex}` : "none", transition: "box-shadow .2s" }}
                >
                  {on && <Check size={16} strokeWidth={3.4} color="#0B0B0D" />}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Frequency">
          <div className="flex flex-col gap-3">
            <Segmented
              value={d.frequency.type}
              onChange={(t) => set({ frequency: t === "weekdays" ? { type: "weekdays", days: [1, 2, 3, 4, 5] } : t === "weekly" ? { type: "weekly", times: 3 } : { type: "daily" } })}
              options={[{ value: "daily", label: "Every day" }, { value: "weekdays", label: "Certain days" }, { value: "weekly", label: "Times a week" }]}
            />
            {d.frequency.type === "weekdays" && (
              <div className="flex gap-1.5">
                {DAY_LETTER.map((L, i) => {
                  const on = d.frequency.days.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const days = on ? d.frequency.days.filter((x) => x !== i) : [...d.frequency.days, i];
                        set({ frequency: { type: "weekdays", days: days.length ? days : [i] } });
                      }}
                      className="flex-1 hk-press"
                      style={{
                        padding: "10px 0", borderRadius: 11, fontSize: 12.5, fontWeight: 650,
                        background: on ? hexA(tint, 0.18) : "rgba(255,255,255,0.04)",
                        border: `1px solid ${on ? hexA(tint, 0.5) : C.line}`,
                        color: on ? tint : C.t3, transition: "all .18s",
                      }}
                    >
                      {L}
                    </button>
                  );
                })}
              </div>
            )}
            {d.frequency.type === "weekly" && (
              <Stepper value={d.frequency.times} onChange={(v) => set({ frequency: { type: "weekly", times: v } })} min={1} max={7} suffix="times a week" />
            )}
          </div>
        </Field>

        <Field label="Daily goal" hint="How many times a day counts as done">
          <Stepper value={d.goal} onChange={(v) => set({ goal: v })} min={1} max={20} suffix={d.goal === 1 ? "time" : "times"} />
        </Field>

        <Field label="Reminder">
          <div style={{ background: C.alt, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
            <div className="flex items-center gap-3" style={{ padding: "12px 14px", borderBottom: d.reminder.enabled ? `1px solid ${C.soft}` : "none" }}>
              <Bell size={16} style={{ color: C.t2 }} />
              <span className="flex-1" style={{ fontSize: 14.5 }}>Remind me</span>
              <Switch checked={d.reminder.enabled} onChange={(v) => set({ reminder: { ...d.reminder, enabled: v } })} tint={tint} />
            </div>
            {d.reminder.enabled && (
              <div className="flex items-center gap-3" style={{ padding: "12px 14px" }}>
                <Clock size={16} style={{ color: C.t2 }} />
                <span className="flex-1" style={{ fontSize: 14.5 }}>Time</span>
                <input
                  type="time"
                  value={d.reminder.time}
                  onChange={(e) => set({ reminder: { ...d.reminder, time: e.target.value } })}
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px", fontSize: 14, color: C.t1, colorScheme: "dark" }}
                />
              </div>
            )}
          </div>
        </Field>

        <button
          onClick={save}
          className="hk-press"
          style={{
            width: "100%", padding: "15px", borderRadius: 16, fontSize: 15.5, fontWeight: 650,
            background: valid ? tint : "rgba(255,255,255,0.06)", color: valid ? "#0B0B0D" : C.t3,
            transition: "background .2s, color .2s",
          }}
        >
          {editing ? "Save changes" : "Create habit"}
        </button>
      </div>
    </Sheet>
  );
}

/* ============================================================================
   Month calendar (shared by the habit detail screen and the Calendar tab)
   ========================================================================== */

function MonthCalendar({ month, onMonthChange, weekStart, renderCell, compact }) {
  const C = useC();
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (((first.getDay() - weekStart) % 7) + 7) % 7;
  const start = addDays(first, -lead);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = days[35] && days[35].getMonth() === month.getMonth() ? 6 : 5;
  const visible = days.slice(0, weeks * 7);
  const labels = Array.from({ length: 7 }, (_, i) => DAY_LETTER[(weekStart + i) % 7]);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="hk-press flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: C.t2 }} aria-label="Previous month">
          <ChevronLeft size={17} strokeWidth={2.3} />
        </button>
        <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: -0.2 }}>
          {MONTHS[month.getMonth()]} <span style={{ color: C.t2, fontWeight: 500 }}>{month.getFullYear()}</span>
        </div>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="hk-press flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", color: C.t2 }} aria-label="Next month">
          <ChevronRight size={17} strokeWidth={2.3} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: compact ? 4 : 6, marginBottom: 6 }}>
        {labels.map((l, i) => (
          <div key={i} className="text-center" style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: 0.4 }}>{l}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: compact ? 4 : 6 }}>
        {visible.map((d) => renderCell(d, d.getMonth() === month.getMonth()))}
      </div>
    </div>
  );
}

/* ============================================================================
   Habit detail
   ========================================================================== */

function StatTile({ label, value, sub, tint, icon: I }) {
  const C = useC();
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: "13px 14px" }}>
      <div className="flex items-center gap-1.5" style={{ marginBottom: 7, color: tint || C.t2 }}>
        {I && <I size={13} strokeWidth={2.4} />}
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.t2 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.9, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: C.t1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.t3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function HabitDetail({ habit, stats, weekStart, onBack, onEdit, onArchive, onDelete, onSetCount, pulse }) {
  const C = useC();
  const tint = accent(habit.color);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const today = startOfDay(new Date());

  const history = useMemo(
    () => Object.keys(habit.completions).filter((k) => habit.completions[k] > 0).sort((a, b) => (a < b ? 1 : -1)).slice(0, 12),
    [habit.completions]
  );

  const freqLabel =
    habit.frequency?.type === "weekdays" ? habit.frequency.days.slice().sort().map((i) => DAY_ABBR[i]).join(" · ")
    : habit.frequency?.type === "weekly" ? `${habit.frequency.times}× a week`
    : "Every day";

  return (
    <>
      <header className="flex items-center justify-between shrink-0" style={{ padding: "14px 14px 12px", borderBottom: `1px solid ${C.soft}` }}>
        <button onClick={onBack} className="hk-press flex items-center gap-1" style={{ color: C.t2, fontSize: 14.5 }}>
          <ChevronLeft size={19} strokeWidth={2.4} /> Back
        </button>
        <div className="flex items-center gap-2">
          <IconBtn icon={Pencil} onClick={onEdit} label="Edit habit" size={34} />
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="More options"
            aria-expanded={menu}
            className="hk-press flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.055)", border: `1px solid ${C.line}`, color: C.t2 }}
          >
            <ChevronDown size={16} strokeWidth={2.4} style={{ transform: menu ? "rotate(180deg)" : "none", transition: "transform .22s" }} />
          </button>
        </div>
      </header>

      <div className="flex-1 hk-scroll" style={{ overflowY: "auto", minHeight: 0, padding: "18px 16px 30px" }}>
        {menu && (
          <div className="hk-in" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, marginBottom: 16, overflow: "hidden" }}>
            <Row icon={Archive} label={habit.archived ? "Restore from archive" : "Archive habit"} onClick={() => { onArchive(); setMenu(false); }} right={<span />} />
            <Row icon={Trash2} label="Delete habit" tint={ACCENTS.red.hex} onClick={() => setConfirm(true)} right={<span />} last />
          </div>
        )}

        <div className="flex items-center gap-3.5" style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: 54, height: 54, borderRadius: 17, background: hexA(tint, 0.15), color: tint, border: `1px solid ${hexA(tint, 0.2)}` }}>
            <Glyph name={habit.icon} size={26} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15 }}>{habit.name}</h1>
            <div style={{ fontSize: 13, color: C.t2, marginTop: 3 }}>{habit.description || freqLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ marginBottom: 18, flexWrap: "wrap" }}>
          <Chip icon={Repeat} label={freqLabel} />
          {goalOf(habit) > 1 && <Chip icon={Target} label={`${goalOf(habit)}× a day`} />}
          {habit.reminder?.enabled && <Chip icon={Bell} label={habit.reminder.time} />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatTile label="Current streak" icon={Flame} tint={tint} value={`${stats.current}`} sub={`${stats.unitWord}${stats.current === 1 ? "" : "s"} in a row`} />
          <StatTile label="Longest streak" icon={Award} tint={tint} value={`${stats.longest}`} sub={`${stats.unitWord}${stats.longest === 1 ? "" : "s"} at best`} />
          <StatTile label="Completion" icon={TrendingUp} tint={tint} value={`${stats.percent}%`} sub="since you started" />
          <StatTile label="Total done" icon={Check} tint={tint} value={`${stats.completions}`} sub="days completed" />
        </div>

        <SectionTitle>Activity</SectionTitle>
        <Card style={{ padding: 15, marginBottom: 20 }}>
          <ActivityGrid habit={habit} weeks={26} weekStart={weekStart} pulseKey={pulse} showMonths radius={3} gap={2.5} />
          <div className="flex items-center justify-end gap-1.5" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 10.5, color: C.t3, marginRight: 3 }}>Less</span>
            {[0, 0.35, 0.6, 0.85, 1].map((v, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: v === 0 ? C.empty : hexA(tint, 0.3 + 0.7 * v) }} />
            ))}
            <span style={{ fontSize: 10.5, color: C.t3, marginLeft: 3 }}>More</span>
          </div>
        </Card>

        <SectionTitle trailing={<span style={{ fontSize: 11.5, color: C.t3 }}>Tap a day to change it</span>}>Calendar</SectionTitle>
        <Card style={{ padding: 15, marginBottom: 20 }}>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            weekStart={weekStart}
            renderCell={(d, inMonth) => {
              const key = toKey(d);
              const n = countOn(habit, key), g = goalOf(habit);
              const future = d > today;
              const isToday = sameDay(d, today);
              const ratio = Math.min(1, n / g);
              return (
                <button
                  key={key}
                  disabled={future}
                  onClick={() => onSetCount(key, n >= g ? 0 : g)}
                  className="hk-press flex items-center justify-center"
                  style={{
                    aspectRatio: "1 / 1", borderRadius: 11,
                    background: n > 0 ? hexA(tint, 0.25 + 0.75 * ratio) : "rgba(255,255,255,0.035)",
                    color: n >= g ? "#0B0B0D" : inMonth ? (future ? C.t3 : C.t2) : "rgba(255,255,255,0.14)",
                    opacity: inMonth ? 1 : 0.35,
                    fontSize: 13, fontWeight: n > 0 ? 700 : 500, fontVariantNumeric: "tabular-nums",
                    boxShadow: isToday ? `0 0 0 1.5px ${hexA(tint, 0.9)}` : "none",
                    transition: "background .25s, color .25s",
                  }}
                >
                  {d.getDate()}
                </button>
              );
            }}
          />
        </Card>

        <SectionTitle>Recent history</SectionTitle>
        <Card style={{ overflow: "hidden" }}>
          {history.length === 0 && (
            <div style={{ padding: "22px 16px", textAlign: "center", fontSize: 13.5, color: C.t3 }}>
              Nothing logged yet. Tick today off and it will show up here.
            </div>
          )}
          {history.map((k, i) => {
            const n = habit.completions[k], g = goalOf(habit), full = n >= g;
            return (
              <div key={k} className="flex items-center gap-3" style={{ padding: "12px 14px", borderBottom: i === history.length - 1 ? "none" : `1px solid ${C.soft}` }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 8, background: hexA(tint, full ? 0.9 : 0.25), color: full ? "#0B0B0D" : tint }}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="flex-1" style={{ fontSize: 14 }}>{relativeLabel(k)}</span>
                <span style={{ fontSize: 12.5, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{g > 1 ? `${n}/${g}` : "Done"}</span>
              </div>
            );
          })}
        </Card>
      </div>

      {confirm && (
        <ConfirmDialog
          title={`Delete "${habit.name}"?`}
          body="This removes the habit and its whole history. Archiving keeps the record instead."
          confirmLabel="Delete habit"
          onCancel={() => setConfirm(false)}
          onConfirm={() => { setConfirm(false); onDelete(); }}
        />
      )}
    </>
  );
}

function Chip({ icon: I, label }) {
  const C = useC();
  return (
    <div className="flex items-center gap-1.5" style={{ padding: "6px 11px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`, fontSize: 12, color: C.t2 }}>
      {I && <I size={12.5} strokeWidth={2.3} />} {label}
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  const C = useC();
  return (
    <div className="flex items-center justify-center" style={{ ...SHELL, zIndex: 80, padding: 26, background: "rgba(0,0,0,0.66)", backdropFilter: "blur(4px)" }}>
      <div className="hk-in" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 20, width: "100%", maxWidth: 320 }}>
        <div style={{ fontSize: 16.5, fontWeight: 650, letterSpacing: -0.3, marginBottom: 7 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: C.t2, lineHeight: 1.45, marginBottom: 18 }}>{body}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 hk-press" style={{ padding: "12px", borderRadius: 13, background: "rgba(255,255,255,0.06)", fontSize: 14.5, fontWeight: 600, color: C.t1 }}>Keep it</button>
          <button onClick={onConfirm} className="flex-1 hk-press" style={{ padding: "12px", borderRadius: 13, background: ACCENTS.red.hex, fontSize: 14.5, fontWeight: 650, color: "#0B0B0D" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Statistics
   ========================================================================== */

function CombinedGrid({ habits, weeks, weekStart }) {
  const C = useC();
  const today = startOfDay(new Date());
  const cells = useMemo(() => {
    const end = addDays(startOfWeek(today, weekStart), 6);
    const start = addDays(end, -(weeks * 7 - 1));
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const date = addDays(start, Math.floor(i / 7) * 7 + (i % 7));
      const key = toKey(date);
      const due = habits.filter((h) => isScheduled(h.frequency, date) && fromKey(h.createdAt) <= date);
      const done = due.filter((h) => isDone(h, key)).length;
      return { key, date, ratio: due.length ? done / due.length : 0, future: date > today };
    });
  }, [habits, weeks, weekStart, +today]);

  return (
    <div style={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 3 }}>
      {cells.map((c) => (
        <div
          key={c.key}
          style={{
            aspectRatio: "1 / 1", borderRadius: 3.5,
            background: c.future ? hexA("#FFFFFF", 0.018) : c.ratio > 0 ? hexA(ACCENTS.green.hex, 0.22 + 0.78 * c.ratio) : C.empty,
            boxShadow: sameDay(c.date, today) ? `0 0 0 1.4px rgba(255,255,255,0.3)` : "none",
          }}
        />
      ))}
    </div>
  );
}

function StatisticsScreen({ habits, weekStart, onOpenHabit }) {
  const C = useC();
  const today = startOfDay(new Date());
  const todayKey = toKey(today);

  const all = useMemo(() => habits.map((h) => ({ h, s: habitStats(h, weekStart) })), [habits, weekStart]);

  const dueToday = habits.filter((h) => isScheduled(h.frequency, today));
  const doneToday = dueToday.filter((h) => isDone(h, todayKey)).length;
  const todayRatio = dueToday.length ? doneToday / dueToday.length : 0;

  const best = all.reduce((m, x) => Math.max(m, x.s.current), 0);
  const longest = all.reduce((m, x) => Math.max(m, x.s.longest), 0);
  const totalDone = all.reduce((m, x) => m + x.s.completions, 0);
  const overall = all.length ? Math.round(all.reduce((m, x) => m + x.s.percent, 0) / all.length) : 0;

  const dayRatio = (date) => {
    const key = toKey(date);
    const due = habits.filter((h) => isScheduled(h.frequency, date) && fromKey(h.createdAt) <= date);
    if (!due.length) return 0;
    return due.filter((h) => isDone(h, key)).length / due.length;
  };

  const week = useMemo(() => {
    const ws = startOfWeek(today, weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i);
      return { label: DAY_LETTER[d.getDay()], value: d > today ? 0 : dayRatio(d) };
    });
  }, [habits, weekStart, +today]);

  const month = useMemo(() => Array.from({ length: 30 }, (_, i) => dayRatio(addDays(today, -(29 - i)))), [habits, +today]);

  const weekAvg = Math.round((week.filter((d, i) => addDays(startOfWeek(today, weekStart), i) <= today).reduce((m, d) => m + d.value, 0) / Math.max(1, week.filter((d, i) => addDays(startOfWeek(today, weekStart), i) <= today).length)) * 100);
  const monthAvg = Math.round((month.reduce((a, b) => a + b, 0) / month.length) * 100);

  const cBest = useCountUp(best), cLong = useCountUp(longest), cTotal = useCountUp(totalDone), cPct = useCountUp(overall);
  const ranked = [...all].sort((a, b) => b.s.percent - a.s.percent);

  return (
    <div style={{ padding: "6px 16px 26px" }}>
      <Card style={{ padding: 18, marginBottom: 20 }} className="hk-in">
        <div className="flex items-center gap-4">
          <Ring value={todayRatio} tint={ACCENTS.green.hex} size={82} stroke={7}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.7, fontVariantNumeric: "tabular-nums" }}>{Math.round(todayRatio * 100)}%</span>
          </Ring>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: -0.4 }}>
              {doneToday === dueToday.length && dueToday.length > 0 ? "Today is clear" : "Today so far"}
            </div>
            <div style={{ fontSize: 13.5, color: C.t2, marginTop: 3, lineHeight: 1.4 }}>
              {dueToday.length === 0 ? "Nothing scheduled for today." : `${doneToday} of ${dueToday.length} habits ticked off.`}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        <StatTile label="Best streak now" icon={Flame} value={cBest} sub="across all habits" />
        <StatTile label="Longest ever" icon={Award} value={cLong} sub="your record" />
        <StatTile label="Total completions" icon={Check} value={cTotal} sub="days ticked off" />
        <StatTile label="Completion rate" icon={TrendingUp} value={`${cPct}%`} sub="average, all habits" />
      </div>

      <SectionTitle trailing={<span style={{ fontSize: 12, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{weekAvg}% average</span>}>This week</SectionTitle>
      <Card style={{ padding: 16, marginBottom: 22 }}>
        <BarChart data={week} tint={ACCENTS.green.hex} height={88} />
      </Card>

      <SectionTitle trailing={<span style={{ fontSize: 12, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{monthAvg}% average</span>}>Last 30 days</SectionTitle>
      <Card style={{ padding: "16px 16px 12px", marginBottom: 22 }}>
        <AreaChart values={month} tint={ACCENTS.blue.hex} height={96} />
        <div className="flex justify-between" style={{ marginTop: 8, fontSize: 10.5, color: C.t3, fontWeight: 600 }}>
          <span>30 days ago</span><span>Today</span>
        </div>
      </Card>

      <SectionTitle>All activity</SectionTitle>
      <Card style={{ padding: 15, marginBottom: 22 }}>
        <CombinedGrid habits={habits} weeks={20} weekStart={weekStart} />
        <div style={{ fontSize: 11.5, color: C.t3, marginTop: 11, lineHeight: 1.4 }}>
          Each square is a day. The brighter it is, the more of that day's habits you finished.
        </div>
      </Card>

      <SectionTitle>By habit</SectionTitle>
      <Card style={{ overflow: "hidden" }}>
        {ranked.map(({ h, s }, i) => {
          const tint = accent(h.color);
          return (
            <button
              key={h.id}
              onClick={() => onOpenHabit(h.id)}
              className="flex items-center gap-3 w-full text-left"
              style={{ padding: "13px 14px", borderBottom: i === ranked.length - 1 ? "none" : `1px solid ${C.soft}` }}
            >
              <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: hexA(tint, 0.15), color: tint }}>
                <Glyph name={h.icon} size={15} strokeWidth={2.2} />
              </div>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", marginTop: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.percent}%`, background: tint, borderRadius: 999, transition: "width .8s cubic-bezier(.2,.8,.2,1)" }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div style={{ fontSize: 14, fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{s.percent}%</div>
                <div style={{ fontSize: 11, color: C.t3, fontVariantNumeric: "tabular-nums" }}>{s.current} {s.unitWord[0]}</div>
              </div>
            </button>
          );
        })}
      </Card>
    </div>
  );
}

/* ============================================================================
   Calendar tab
   ========================================================================== */

function CalendarScreen({ habits, weekStart, onSetCount, onOpenHabit }) {
  const C = useC();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => toKey(today));
  const selDate = fromKey(selected);

  const due = habits.filter((h) => isScheduled(h.frequency, selDate) && fromKey(h.createdAt) <= selDate);
  const doneCount = due.filter((h) => isDone(h, selected)).length;
  const isFuture = selDate > today;

  return (
    <div className="hk-scroll" style={{ overflowY: "auto", padding: "6px 16px 26px" }}>
      <Card style={{ padding: 16, marginBottom: 20 }} className="hk-in">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          weekStart={weekStart}
          renderCell={(d, inMonth) => {
            const key = toKey(d);
            const future = d > today;
            const isSel = key === selected;
            const isToday = sameDay(d, today);
            const dueD = habits.filter((h) => isScheduled(h.frequency, d) && fromKey(h.createdAt) <= d);
            const doneD = dueD.filter((h) => isDone(h, key));
            const ratio = dueD.length ? doneD.length / dueD.length : 0;

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="hk-press flex flex-col items-center justify-center"
                style={{
                  aspectRatio: "1 / 1", borderRadius: 12, gap: 3,
                  background: isSel ? "rgba(255,255,255,0.11)" : ratio > 0 && !future ? hexA(ACCENTS.green.hex, 0.06 + 0.1 * ratio) : "rgba(255,255,255,0.028)",
                  boxShadow: isSel ? "0 0 0 1.5px rgba(255,255,255,0.55)" : isToday ? `0 0 0 1.5px ${hexA(BRAND.blue, 0.85)}` : "none",
                  opacity: inMonth ? (future ? 0.45 : 1) : 0.28,
                  transition: "background .2s, box-shadow .2s",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? BRAND.blue : C.t1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {d.getDate()}
                </span>
                <span className="flex items-center justify-center" style={{ gap: 2, height: 4 }}>
                  {doneD.slice(0, 4).map((h) => (
                    <span key={h.id} style={{ width: 4, height: 4, borderRadius: 999, background: accent(h.color) }} />
                  ))}
                  {doneD.length > 4 && <span style={{ width: 4, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.35)" }} />}
                </span>
              </button>
            );
          }}
        />
      </Card>

      <SectionTitle trailing={<span style={{ fontSize: 12, color: C.t2, fontVariantNumeric: "tabular-nums" }}>{due.length ? `${doneCount}/${due.length}` : "—"}</span>}>
        {sameDay(selDate, today) ? "Today" : `${DAYS_FULL[selDate.getDay()]}, ${selDate.getDate()} ${MON_ABBR[selDate.getMonth()]}`}
      </SectionTitle>

      <Card style={{ overflow: "hidden" }}>
        {due.length === 0 && (
          <div style={{ padding: "26px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 4 }}>Nothing was scheduled</div>
            <div style={{ fontSize: 12.5, color: C.t3 }}>No habits were due on this day.</div>
          </div>
        )}
        {due.map((h, i) => {
          const tint = accent(h.color);
          const n = countOn(h, selected), g = goalOf(h), done = n >= g;
          return (
            <div key={h.id} className="flex items-center gap-3" style={{ padding: "12px 14px", borderBottom: i === due.length - 1 ? "none" : `1px solid ${C.soft}` }}>
              <button onClick={() => onOpenHabit(h.id)} className="flex items-center gap-3 flex-1 text-left" style={{ minWidth: 0 }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: hexA(tint, 0.15), color: tint }}>
                  <Glyph name={h.icon} size={15} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                  {g > 1 && <div style={{ fontSize: 11.5, color: C.t3, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{n} of {g}</div>}
                </div>
              </button>
              <button
                disabled={isFuture}
                onClick={() => onSetCount(h.id, selected, done ? 0 : g)}
                aria-label={done ? "Mark not done" : "Mark done"}
                className="hk-press flex items-center justify-center shrink-0"
                style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: done ? tint : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${done ? tint : C.line}`,
                  color: done ? "#0B0B0D" : C.t3, opacity: isFuture ? 0.35 : 1,
                  transition: "background .22s, color .22s, border-color .22s",
                }}
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ============================================================================
   Settings
   ========================================================================== */

function SettingsScreen({ state, setState, habits, archived, onRestore, onReset, onClear, notify }) {
  const C = useC();
  const s = state.settings;
  const [exporting, setExporting] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null);
  const patch = (p) => setState((x) => ({ ...x, settings: { ...x.settings, ...p } }));

  const json = useMemo(() => JSON.stringify(state, null, 2), [state]);

  const download = () => {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `habitflow-${toKey(new Date())}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      notify("Export downloaded");
    } catch { notify("Copy the text instead"); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(json); notify("Copied to clipboard"); }
    catch { notify("Select the text and copy"); }
  };

  return (
    <div className="hk-scroll" style={{ overflowY: "auto", padding: "6px 16px 26px" }}>
      <SectionTitle>Appearance</SectionTitle>
      <Card style={{ padding: 14, marginBottom: 20 }} className="hk-in">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 14 }}>
          {Object.values(THEMES).map((t) => {
            const on = t.id === s.theme;
            return (
              <button key={t.id} onClick={() => patch({ theme: t.id })} className="hk-press" style={{ borderRadius: 14, padding: 9, background: t.bg, border: `1.5px solid ${on ? "rgba(255,255,255,0.6)" : C.line}`, transition: "border-color .2s" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, marginBottom: 8 }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} style={{ aspectRatio: "1 / 1", borderRadius: 2.5, background: i % 3 === 0 ? ACCENTS.green.hex : t.empty }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: on ? C.t1 : C.t2 }}>{t.label}</div>
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: `1px solid ${C.soft}`, marginLeft: -14, marginRight: -14 }}>
          <Row icon={Sparkles} label="Show descriptions" right={<Switch checked={s.showDescriptions} onChange={(v) => patch({ showDescriptions: v })} />} />
          <Row icon={Zap} label="Reduce motion" right={<Switch checked={s.reduceMotion} onChange={(v) => patch({ reduceMotion: v })} />} last />
        </div>
      </Card>

      <SectionTitle>Reminders</SectionTitle>
      <Card style={{ overflow: "hidden", marginBottom: 20 }}>
        <Row icon={Bell} label="Notifications" tint={ACCENTS.orange.hex} right={<Switch checked={s.notifications} onChange={(v) => patch({ notifications: v })} />} />
        <Row
          icon={Clock} label="Default reminder time" tint={ACCENTS.orange.hex}
          right={<input type="time" value={s.reminderTime} onChange={(e) => patch({ reminderTime: e.target.value })} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.line}`, borderRadius: 9, padding: "5px 9px", fontSize: 13.5, color: C.t1, colorScheme: "dark" }} />}
        />
        <Row
          icon={CalendarDays} label="Week starts on" tint={ACCENTS.blue.hex}
          right={
            <div className="flex gap-1">
              {[{ v: 0, l: "Sun" }, { v: 1, l: "Mon" }].map((o) => (
                <button key={o.v} onClick={() => patch({ weekStart: o.v })} style={{ padding: "6px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, background: s.weekStart === o.v ? "#F2F2F5" : "rgba(255,255,255,0.06)", color: s.weekStart === o.v ? "#0B0B0D" : C.t2, transition: "background .2s, color .2s" }}>
                  {o.l}
                </button>
              ))}
            </div>
          }
          last
        />
      </Card>

      {archived.length > 0 && (
        <>
          <SectionTitle>Archived</SectionTitle>
          <Card style={{ overflow: "hidden", marginBottom: 20 }}>
            {archived.map((h, i) => (
              <div key={h.id} className="flex items-center gap-3" style={{ padding: "12px 14px", borderBottom: i === archived.length - 1 ? "none" : `1px solid ${C.soft}` }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.06)", color: C.t3 }}>
                  <Glyph name={h.icon} size={15} strokeWidth={2.2} />
                </div>
                <span className="flex-1" style={{ fontSize: 14, color: C.t2 }}>{h.name}</span>
                <button onClick={() => onRestore(h.id)} className="hk-press flex items-center gap-1.5" style={{ padding: "6px 11px", borderRadius: 9, background: "rgba(255,255,255,0.06)", fontSize: 12.5, fontWeight: 600, color: C.t1 }}>
                  <RotateCcw size={13} strokeWidth={2.4} /> Restore
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>Your data</SectionTitle>
      <Card style={{ overflow: "hidden", marginBottom: 20 }}>
        <Row icon={Download} label="Export habits" value={`${habits.length + archived.length} habits`} tint={ACCENTS.green.hex} onClick={() => setExporting(true)} />
        <Row icon={RotateCcw} label="Reset to sample data" tint={ACCENTS.blue.hex} onClick={() => setConfirmMode("reset")} />
        <Row icon={Trash2} label="Start over" value="Delete everything" tint={ACCENTS.red.hex} onClick={() => setConfirmMode("clear")} last />
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card style={{ padding: 18, marginBottom: 10 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
          <LogoMark size={40} />
          <div>
            <Wordmark size={17} />
            <div style={{ fontSize: 12, color: C.t3, marginTop: 3 }}>Version 1.0</div>
          </div>
        </div>
        <div style={{ width: 132, marginBottom: 13 }}><ProgressBar value={1} height={4} /></div>
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.55 }}>
          {TAGLINE} One square for every day — fill them in and the pattern does the rest. No points, no badges, nothing to lose but the flow you built.
        </p>
      </Card>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.t3, padding: "6px 0 4px" }}>
        Everything stays on this device.
      </div>

      <Sheet open={exporting} onClose={() => setExporting(false)} title="Export" action={<button onClick={copy} style={{ fontSize: 14.5, fontWeight: 650, color: ACCENTS.green.hex }}>Copy</button>}>
        <div style={{ padding: "4px 16px 26px" }}>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, marginBottom: 13 }}>
            Your habits and full history as JSON. Save the file or copy the text.
          </p>
          <textarea
            readOnly
            value={json}
            onFocus={(e) => e.target.select()}
            className="hk-scroll"
            style={{ width: "100%", height: 220, background: C.alt, border: `1px solid ${C.line}`, borderRadius: 14, padding: 13, fontSize: 11, lineHeight: 1.5, color: C.t2, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", resize: "none" }}
          />
          <button onClick={download} className="hk-press" style={{ width: "100%", marginTop: 13, padding: 14, borderRadius: 15, background: ACCENTS.green.hex, color: "#0B0B0D", fontSize: 15, fontWeight: 650 }}>
            Download file
          </button>
        </div>
      </Sheet>

      {confirmMode === "reset" && (
        <ConfirmDialog
          title="Reset to sample data?"
          body="Your habits and history are replaced with the sample set. Export first if you want to keep them."
          confirmLabel="Reset"
          onCancel={() => setConfirmMode(null)}
          onConfirm={() => { setConfirmMode(null); onReset(); }}
        />
      )}
      {confirmMode === "clear" && (
        <ConfirmDialog
          title="Delete every habit?"
          body="This clears all habits and their history, and you start from an empty grid."
          confirmLabel="Delete all"
          onCancel={() => setConfirmMode(null)}
          onConfirm={() => { setConfirmMode(null); onClear(); }}
        />
      )}
    </div>
  );
}

/* ============================================================================
   Chrome: logo, nav, toast, empty + loading states
   ========================================================================== */

/**
 * The app icon. `progress` scales every bar toward its resting fill, so the
 * splash can flow the bars up from empty; `animate` does the same in SVG.
 */
function LogoMark({ size = 32, progress = 1, animate = false }) {
  const uid = useRef(`lm${Math.random().toString(36).slice(2, 8)}`).current;
  const { x, w, h, r, radius } = ICON;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        {ICON.bars.map((b, i) => (
          <clipPath key={i} id={`${uid}-${i}`}>
            <rect x={x} y={b.cy - h / 2} width={w} height={h} rx={r} />
          </clipPath>
        ))}
      </defs>
      <rect x="0.5" y="0.5" width="63" height="63" rx={radius} fill={ICON.bg} stroke="rgba(255,255,255,0.10)" />
      {ICON.bars.map((b, i) => {
        const filled = w * Math.max(0, Math.min(1, b.value * progress));
        return (
          <g key={i}>
            <rect x={x} y={b.cy - h / 2} width={w} height={h} rx={r} fill={b.track} />
            <rect x={x} y={b.cy - h / 2} width={filled} height={h} fill={b.fill} clipPath={`url(#${uid}-${i})`}>
              {animate && (
                <animate
                  attributeName="width" values={`0;${filled}`} keyTimes="0;1"
                  dur="0.9s" begin={`${i * 0.09}s`} calcMode="spline" keySplines="0.2 0.8 0.2 1" fill="freeze"
                />
              )}
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

/** HabitFlow, coloured the way the mark is: F blue, lo amber, w green. */
function Wordmark({ size = 20 }) {
  return (
    <span style={{ fontSize: size, fontWeight: 680, letterSpacing: -0.5, whiteSpace: "nowrap", lineHeight: 1 }}>
      <span style={{ color: "#FBFBFB" }}>Habit</span>
      <span style={{ color: BRAND.blue }}>F</span>
      <span style={{ color: BRAND.amber }}>lo</span>
      <span style={{ color: BRAND.green }}>w</span>
    </span>
  );
}

/**
 * Today's progress, drawn as the logo's underline. Each segment fills in turn,
 * so finishing everything rebuilds the mark exactly.
 */
function ProgressBar({ value, height = 5 }) {
  return (
    <div style={{ display: "flex", height, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
      {LOGO_BAR.map((seg, i) => {
        const start = LOGO_BAR.slice(0, i).reduce((a, b) => a + b.w, 0);
        const fill = Math.max(0, Math.min(1, (value - start) / seg.w));
        const pct = Math.round(fill * 1000) / 10; // keeps the inline width clean
        return (
          <div key={i} style={{ width: `${seg.w * 100}%`, position: "relative" }}>
            <div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
                background: seg.color, transition: "width .5s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function BottomNav({ tab, onChange }) {
  const C = useC();
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "stats", label: "Statistics", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <nav className="flex shrink-0" style={{ borderTop: `1px solid ${C.line}`, background: C.nav, backdropFilter: "blur(22px)", paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
      {items.map((it) => {
        const on = tab === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} className="flex-1 relative flex flex-col items-center justify-center gap-1" style={{ padding: "9px 0 7px", color: on ? C.t1 : C.t3, transition: "color .2s" }}>
            <span style={{ position: "absolute", top: 0, width: 22, height: 2, borderRadius: 999, background: on ? C.t1 : "transparent", transition: "background .22s" }} />
            <it.icon size={20} strokeWidth={on ? 2.4 : 2} />
            <span style={{ fontSize: 9.5, fontWeight: on ? 650 : 500, letterSpacing: 0.1 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Toast({ message }) {
  const C = useC();
  if (!message) return null;
  return (
    <div className="flex justify-center" style={{ ...SHELL, top: "auto", bottom: 78, zIndex: 70, pointerEvents: "none" }}>
      <div className="hk-in" style={{ background: "rgba(30,30,34,0.96)", border: `1px solid ${C.line}`, borderRadius: 999, padding: "9px 17px", fontSize: 13.5, fontWeight: 550, color: C.t1, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backdropFilter: "blur(14px)" }}>
        {message}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  const C = useC();
  return (
    <div className="flex flex-col items-center justify-center text-center hk-in" style={{ padding: "56px 30px" }}>
      <div style={{ width: 132, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, marginBottom: 26, opacity: 0.55 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: "1 / 1", borderRadius: 3, background: i === 27 ? ACCENTS.green.hex : C.empty }} />
        ))}
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 680, letterSpacing: -0.5, marginBottom: 7 }}>One square to start</h2>
      <p style={{ fontSize: 13.5, color: C.t2, lineHeight: 1.5, maxWidth: 260, marginBottom: 22 }}>
        Add the first habit you want to keep. Tick it off tonight and the grid begins.
      </p>
      <button onClick={onAdd} className="hk-press flex items-center gap-2" style={{ padding: "13px 22px", borderRadius: 15, background: "#F2F2F5", color: "#0B0B0D", fontSize: 15, fontWeight: 650 }}>
        <Plus size={18} strokeWidth={2.8} /> Add a habit
      </button>
    </div>
  );
}

function LoadingState() {
  const C = useC();
  return (
    <div style={{ padding: "6px 16px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 15, marginBottom: 12, opacity: 1 - i * 0.22 }}>
          <div className="flex items-center gap-3">
            <div className="hk-shimmer" style={{ width: 38, height: 38, borderRadius: 12 }} />
            <div className="flex-1">
              <div className="hk-shimmer" style={{ height: 11, borderRadius: 5, width: "58%", marginBottom: 7 }} />
              <div className="hk-shimmer" style={{ height: 9, borderRadius: 5, width: "38%" }} />
            </div>
            <div className="hk-shimmer" style={{ width: 42, height: 42, borderRadius: 999 }} />
          </div>
          <div style={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 3, marginTop: 14 }}>
            {Array.from({ length: 140 }).map((_, k) => <div key={k} style={{ aspectRatio: "1 / 1", borderRadius: 3.5, background: C.empty }} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   App
   ========================================================================== */

const STORAGE_KEY = "habitflow:state:v1";
const LEGACY_KEY = "habitkit:state:v1"; // carry over anything saved before the rename
const mem = {};
const store = {
  async get(k) {
    if (typeof window !== "undefined" && window.storage) return window.storage.get(k);
    return mem[k] != null ? { key: k, value: mem[k] } : null;
  },
  async set(k, v) {
    if (typeof window !== "undefined" && window.storage) return window.storage.set(k, v);
    mem[k] = v; return { key: k, value: v };
  },
};

const CSS = `
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.hk-root{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Inter","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.hk-root button{font:inherit;color:inherit;background:none;border:none;padding:0;cursor:pointer}
.hk-root input,.hk-root textarea{font:inherit;outline:none}
.hk-root input::placeholder,.hk-root textarea::placeholder{color:#56565E}
.hk-scroll::-webkit-scrollbar{width:0;height:0}
.hk-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}
.hk-press{transition:transform .15s cubic-bezier(.2,.8,.2,1)}
.hk-press:active{transform:scale(.972)}
.hk-root button:focus-visible{outline:2px solid rgba(255,255,255,.65);outline-offset:2px;border-radius:10px}
@keyframes hk-pop{0%{transform:scale(1)}34%{transform:scale(1.2)}62%{transform:scale(.95)}100%{transform:scale(1)}}
@keyframes hk-ring{0%{transform:scale(.62);opacity:.6}100%{transform:scale(2.2);opacity:0}}
@keyframes hk-cell{0%{transform:scale(.35);opacity:.2}62%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes hk-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
@keyframes hk-draw{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
@keyframes hk-shimmer{0%{background-position:-260px 0}100%{background-position:260px 0}}
.hk-in{animation:hk-in .36s cubic-bezier(.2,.8,.2,1) both}
.hk-shimmer{background:linear-gradient(90deg,rgba(255,255,255,.035) 0%,rgba(255,255,255,.085) 50%,rgba(255,255,255,.035) 100%);background-size:260px 100%;animation:hk-shimmer 1.35s linear infinite}
.hk-still *,.hk-still *::before,.hk-still *::after{animation:none!important;transition:none!important}
`;

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [toast, setToast] = useState("");

  /* ---- load ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      let next = null;
      for (const key of [STORAGE_KEY, LEGACY_KEY]) {
        try {
          const r = await store.get(key);
          if (r && r.value) { next = JSON.parse(r.value); break; }
        } catch { /* not saved under this key */ }
      }
      if (!alive) return;
      setState(next && Array.isArray(next.habits) ? next : seedState());
      setTimeout(() => alive && setLoading(false), 340);
    })();
    return () => { alive = false; };
  }, []);

  /* ---- save (debounced) ---- */
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(() => { store.set(STORAGE_KEY, JSON.stringify(state)).catch(() => {}); }, 380);
    return () => clearTimeout(t);
  }, [state]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast((c) => (c === m ? "" : c)), 1900); };

  const theme = { ...(THEMES[state?.settings.theme] || THEMES.charcoal), ...BASE };
  const weekStart = state?.settings.weekStart ?? 1;
  const habits = useMemo(() => (state?.habits || []).filter((h) => !h.archived), [state]);
  const archived = useMemo(() => (state?.habits || []).filter((h) => h.archived), [state]);
  const statsById = useMemo(() => {
    const m = {};
    for (const h of habits) m[h.id] = habitStats(h, weekStart);
    return m;
  }, [habits, weekStart]);

  const detail = habits.concat(archived).find((h) => h.id === detailId) || null;
  const editing = (state?.habits || []).find((h) => h.id === editingId) || null;

  /* ---- mutations ---- */
  const setCount = (habitId, key, n) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        if (h.id !== habitId) return h;
        const c = { ...h.completions };
        if (n > 0) c[key] = n; else delete c[key];
        return { ...h, completions: c };
      }),
    }));
  };

  const toggleToday = (h) => {
    const key = toKey(new Date());
    const n = countOn(h, key), g = goalOf(h);
    const next = n >= g ? 0 : n + 1;
    setCount(h.id, key, next);
    if (next >= g) { setPulse(h.id); setTimeout(() => setPulse((p) => (p === h.id ? null : p)), 700); }
  };

  const saveHabit = (draft) => {
    if (editingId) {
      setState((s) => ({ ...s, habits: s.habits.map((h) => (h.id === editingId ? { ...h, ...draft } : h)) }));
      notify("Changes saved");
    } else {
      const h = { id: `h_${Date.now()}`, ...draft, createdAt: toKey(new Date()), archived: false, completions: {} };
      setState((s) => ({ ...s, habits: [...s.habits, h] }));
      notify("Habit created");
    }
    setSheet(false); setEditingId(null);
  };

  const setArchived = (id, v) => {
    setState((s) => ({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, archived: v } : h)) }));
    notify(v ? "Habit archived" : "Habit restored");
  };

  const removeHabit = (id) => {
    setState((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));
    setDetailId(null);
    notify("Habit deleted");
  };

  /* ---- header content ---- */
  const today = startOfDay(new Date());
  const dueToday = habits.filter((h) => isScheduled(h.frequency, today));
  const doneToday = dueToday.filter((h) => isDone(h, toKey(today))).length;
  const progress = dueToday.length ? doneToday / dueToday.length : 0;

  const TITLES = { stats: "Statistics", calendar: "Calendar", settings: "Settings" };
  const SUBS = {
    stats: "How the last few months have gone",
    calendar: "Pick a day to see what you finished",
    settings: "Make the app work the way you do",
  };

  const body = () => {
    if (loading) return <LoadingState />;
    if (tab === "home") {
      if (habits.length === 0) return <EmptyState onAdd={() => { setEditingId(null); setSheet(true); }} />;
      return (
        <div className="flex flex-col gap-3" style={{ padding: "4px 16px 26px" }}>
          {habits.map((h, i) => (
            <HabitCard
              key={h.id}
              habit={h}
              index={i}
              stats={statsById[h.id]}
              weekStart={weekStart}
              showDescription={state.settings.showDescriptions}
              pulse={pulse === h.id}
              onOpen={() => setDetailId(h.id)}
              onToggle={() => toggleToday(h)}
            />
          ))}
          <button
            onClick={() => { setEditingId(null); setSheet(true); }}
            className="hk-press flex items-center justify-center gap-2"
            style={{ marginTop: 4, padding: "15px", borderRadius: 20, border: `1px dashed ${theme.line}`, color: theme.t2, fontSize: 14.5, fontWeight: 600 }}
          >
            <Plus size={17} strokeWidth={2.6} /> Add a habit
          </button>
        </div>
      );
    }
    if (tab === "stats") {
      if (habits.length === 0) return <EmptyState onAdd={() => { setEditingId(null); setSheet(true); }} />;
      return <StatisticsScreen habits={habits} weekStart={weekStart} onOpenHabit={(id) => setDetailId(id)} />;
    }
    if (tab === "calendar") return <CalendarScreen habits={habits} weekStart={weekStart} onSetCount={setCount} onOpenHabit={(id) => setDetailId(id)} />;
    return (
      <SettingsScreen
        state={state} setState={setState} habits={habits} archived={archived}
        onRestore={(id) => setArchived(id, false)}
        onReset={() => { setState(seedState()); notify("Sample data restored"); }}
        onClear={() => { setState(emptyState()); setTab("home"); notify("Everything cleared"); }}
        notify={notify}
      />
    );
  };

  if (!state) {
    return (
      <ThemeCtx.Provider value={theme}>
        <style>{CSS}</style>
        <div className="hk-root fixed inset-0 flex flex-col items-center justify-center" style={{ background: THEMES.charcoal.bg, gap: 18 }}>
          <LogoMark size={76} animate />
          <div className="flex flex-col items-center" style={{ gap: 8 }}>
            <Wordmark size={27} />
            <span style={{ fontSize: 13, color: BRAND.grey }}>{TAGLINE}</span>
          </div>
          <div style={{ width: 148, marginTop: 4 }}><ProgressBar value={1} height={5} /></div>
        </div>
      </ThemeCtx.Provider>
    );
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <style>{CSS}</style>
      <div className={`hk-root fixed inset-0 flex justify-center ${state.settings.reduceMotion ? "hk-still" : ""}`} style={{ background: theme.bg, color: theme.t1 }}>
        <div className="relative flex flex-col w-full overflow-hidden" style={{ maxWidth: 440, background: theme.bg }}>

          {/* header */}
          <header className="shrink-0" style={{ padding: "16px 16px 12px" }}>
            {tab === "home" ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={32} />
                    <Wordmark size={20} />
                  </div>
                  <div className="flex items-center gap-2">
                    <IconBtn icon={BarChart3} label="Statistics" onClick={() => setTab("stats")} />
                    <IconBtn icon={Settings} label="Settings" onClick={() => setTab("settings")} />
                    <IconBtn icon={Plus} label="Add habit" tone="solid" onClick={() => { setEditingId(null); setSheet(true); }} />
                  </div>
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
                  <span style={{ fontSize: 13, color: theme.t2 }}>
                    {DAYS_FULL[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]}
                  </span>
                  <span style={{ fontSize: 13, color: theme.t2, fontVariantNumeric: "tabular-nums" }}>
                    {dueToday.length ? `${doneToday} of ${dueToday.length} done` : "Nothing due"}
                  </span>
                </div>
                <div style={{ marginTop: 11 }}>
                  <ProgressBar value={progress} height={5} />
                </div>
              </>
            ) : (
              <div className="flex items-end justify-between">
                <div>
                  <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1 }}>{TITLES[tab]}</h1>
                  <p style={{ fontSize: 12.5, color: theme.t2, marginTop: 4 }}>{SUBS[tab]}</p>
                </div>
                {tab !== "settings" && <IconBtn icon={Plus} label="Add habit" tone="solid" onClick={() => { setEditingId(null); setSheet(true); }} />}
              </div>
            )}
          </header>

          {/* body */}
          <main className="flex-1 hk-scroll" style={{ overflowY: "auto", minHeight: 0 }}>
            <div key={tab} className="hk-in">{body()}</div>
          </main>

          <BottomNav tab={tab} onChange={(t) => { setTab(t); setDetailId(null); }} />
          <Toast message={toast} />

          {/* habit detail */}
          <PushScreen open={!!detail}>
            {detail && (
              <HabitDetail
                habit={detail}
                stats={statsById[detail.id] || habitStats(detail, weekStart)}
                weekStart={weekStart}
                pulse={pulse === detail.id}
                onBack={() => setDetailId(null)}
                onEdit={() => { setEditingId(detail.id); setSheet(true); }}
                onArchive={() => { setArchived(detail.id, !detail.archived); setDetailId(null); }}
                onDelete={() => removeHabit(detail.id)}
                onSetCount={(key, n) => setCount(detail.id, key, n)}
              />
            )}
          </PushScreen>

          {/* add / edit */}
          <AddHabitSheet
            open={sheet}
            editing={editing}
            defaults={state.settings}
            onClose={() => { setSheet(false); setEditingId(null); }}
            onSave={saveHabit}
          />
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
