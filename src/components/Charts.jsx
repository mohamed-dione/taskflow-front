import { useEffect, useRef, useState } from "react";
import { count, id, label, pid } from "../api";

export const STATUS_FR = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminée" };
export const PRIO_FR = { LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute" };
export const STATUS_COLORS = ["#94a3b8", "#f59e0b", "#10b981"];
export const PRIO_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const COLORS = ["#4361ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

// Anime une valeur de sa valeur précédente jusqu'à la cible
function useAnimated(target, ms = 900) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setV(target); prev.current = target; return; }
    const from = prev.current;
    let raf, t0;
    const tick = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / ms, 1);
      setV(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// Nombre qui « compte » : accepte 12, "12" ou "45 %"
export function Num({ value, suffix = "" }) {
  const m = typeof value === "string" ? /^(\d+(?:\.\d+)?)(.*)$/.exec(value) : null;
  const n = useAnimated(m ? Number(m[1]) : Number(value) || 0);
  return <>{Math.round(n)}{m ? m[2] : suffix}</>;
}

function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(r); }, []);
  return ready;
}

export function summarize(tasks, projects) {
  const st = (x) => x.status || "TODO";
  const n = (fn) => tasks.filter(fn).length;
  const now = Date.now();
  const done = n((x) => st(x) === "DONE");
  const open = tasks.filter((x) => st(x) !== "DONE");
  const d = new Date();
  const months = [5, 4, 3, 2, 1, 0].map((i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const c = tasks.filter((x) => { const k = new Date(x.createdAt || 0); return k.getFullYear() === m.getFullYear() && k.getMonth() === m.getMonth(); }).length;
    return [m.toLocaleDateString("fr-FR", { month: "short" }), c];
  });
  return {
    total: tasks.length, done, months,
    inProgress: n((x) => st(x) === "IN_PROGRESS"),
    late: open.filter((x) => x.dueDate && new Date(x.dueDate) < now).length,
    rate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    byStatus: Object.entries(STATUS_FR).map(([k, l]) => [l, n((x) => st(x) === k)]),
    byPrio: Object.entries(PRIO_FR).map(([k, l]) => [l, n((x) => x.priority === k)]),
    perProject: projects.map((p) => {
      const ts = tasks.filter((x) => pid(x) === id(p));
      return [p.name, ts.length ? Math.round((ts.filter((x) => st(x) === "DONE").length / ts.length) * 100) : 0];
    }),
    perUser: Object.entries(count(tasks, (x) => (x.assignedTo ? label(x.assignedTo) : "Non assignée"))).sort((a, b) => b[1] - a[1]).slice(0, 6),
    upcoming: open.filter((x) => x.dueDate && new Date(x.dueDate) >= now - 864e5 && new Date(x.dueDate) <= now + 7 * 864e5)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 6),
  };
}

export function Donut({ data, colors = COLORS, center = "au total" }) {
  const total = data.reduce((s, [, v]) => s + v, 0);
  const k = useAnimated(total ? 1 : 0, 1100);
  const R = 52, C = 2 * Math.PI * R;
  const pct = /^(\d+(?:\.\d+)?) %$/.exec(center); // ex. "45 %" : le pourcentage au centre est animé
  let off = 0;
  return (
    <div className="tf-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label="Répartition">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f7" strokeWidth="18" />
        {total > 0 && data.map(([name, v], i) => {
          const len = (v / total) * C * k;
          const el = (
            <circle key={name} cx="70" cy="70" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)">
              <title>{name} : {v}</title>
            </circle>
          );
          off += len;
          return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1b2540">
          {pct ? <Num value={Number(pct[1])} suffix=" %" /> : <Num value={total} />}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="10" fill="#8a94ad">{pct ? "achevé" : center}</text>
      </svg>
      <ul>{data.map(([name, v], i) => (
        <li key={name}><i style={{ background: colors[i % colors.length] }} />{name}
          <b><Num value={v} /></b><em><Num value={total ? Math.round((v / total) * 100) : 0} suffix=" %" /></em></li>
      ))}</ul>
    </div>
  );
}

export function Columns({ data }) {
  const ready = useReady();
  const top = Math.max(4, Math.ceil(Math.max(...data.map(([, v]) => v)) / 4) * 4);
  const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0];
  return (
    <div className="tf-chart">
      <div className="tf-yaxis">{ticks.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="tf-area">
        <div className="tf-plot">{data.map(([name, v]) => (
          <div className="tf-col" key={name} title={`${name} : ${v}`}>
            <i style={{ height: ready ? `${(v / top) * 100}%` : "0%" }}><b><Num value={v} /></b></i>
          </div>
        ))}</div>
        <div className="tf-xl">{data.map(([name]) => <span key={name}>{name}</span>)}</div>
      </div>
    </div>
  );
}

export function HBars({ data, unit = "", max }) {
  const ready = useReady();
  const m = max || Math.max(...data.map(([, v]) => v), 1);
  return (
    <>{data.map(([name, v]) => (
      <div className="tf-bar" key={name}><span>{name}</span><i style={{ width: ready ? `${(v / m) * 100}%` : "0%" }} /><b><Num value={v} suffix={unit} /></b></div>
    ))}</>
  );
}
