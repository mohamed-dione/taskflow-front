import { useCallback, useEffect, useState } from "react";

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const API = RAW.replace(/\/$/, ''); // enlève le / final;
export const PER = 8;

export async function api(path, { method = "GET", body, params } = {}) {
  const token = localStorage.getItem("token");
  const clean = Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== "" && v != null));
  const qs = Object.keys(clean).length ? `?${new URLSearchParams(clean)}` : "";

   // ✅ finalPath est MAINTENANT à l'intérieur, path existe ici
  const finalPath = (API.endsWith('/api') && path.startsWith('/api/')) ? path.slice(4) : path;
  
  const res = await fetch(`${API}${finalPath}${qs}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (res.status === 401 && token) { localStorage.clear(); location.href = "/login"; }
  if (!res.ok) throw new Error(data?.message || data?.error?.message || `Erreur ${res.status}`);
  return data;
}

export const rowsOf = (r) => (Array.isArray(r) ? r : r?.data || r?.items || r?.tasks || r?.projects || r?.users || r?.members || []);
export const toList = rowsOf;
export const id = (x) => x?._id || x?.id;
export const label = (v) => (v && typeof v === "object" ? v.name || v.title || v.email || "—" : v || "—");
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
export const count = (items, fn) => items.reduce((o, x) => { const k = fn(x) || "—"; o[k] = (o[k] || 0) + 1; return o; }, {});
export const pid = (t) => (t.project && typeof t.project === "object" ? id(t.project) : t.project);

// Liste complète (utilisée par les listes déroulantes et la page Utilisateurs)
export function useList(path) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setItems(rowsOf(await api(`${path}?limit=1000`))); setErr(""); } catch (x) { setErr(x.message); }
    setLoading(false);
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { items, err, setErr, loading, load };
}

// Liste paginée par l'API (page, limit + filtres)
export function usePaged(path, params = {}) {
  const [page, setPage] = useState(1);
  const [s, setS] = useState({ items: [], pages: 1, total: 0, loading: true, err: "" });
  const key = JSON.stringify(params);
  const load = useCallback(async () => {
    if (!path) return setS({ items: [], pages: 1, total: 0, loading: false, err: "" });
    setS((o) => ({ ...o, loading: true }));
    try {
      const r = await api(path, { params: { ...params, page, limit: PER } });
      const all = rowsOf(r);
      const m = r?.pagination;
      if (m) setS({ items: all, pages: m.pages || m.totalPages || 1, total: m.total ?? all.length, loading: false, err: "" });
      else setS({ items: all.slice((page - 1) * PER, page * PER), pages: Math.max(1, Math.ceil(all.length / PER)), total: all.length, loading: false, err: "" });
    } catch (x) { setS({ items: [], pages: 1, total: 0, loading: false, err: x.message }); }
  }, [path, key, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [path, key]);
  return { ...s, page, setPage, reload: load };
}

// Statistiques : GET /api/dashboard/stats
export function useStats() {
  const [s, setS] = useState({ data: null, err: "", loading: true });
  useEffect(() => {
    api("/api/dashboard/stats").then((d) => setS({ data: d?.data || d, err: "", loading: false }))
      .catch((x) => setS({ data: null, err: x.message, loading: false }));
  }, []);
  return s;
}

export function normStats(d = {}) {
  const t = d.tasks && typeof d.tasks === "object" ? d.tasks : {};
  const g = (...k) => { for (const key of k) { const v = d[key] ?? t[key]; if (typeof v === "number") return v; } return 0; };
  const raw = d.byStatus || d.tasksByStatus || d.statusDistribution || t.byStatus || {};
  const bs = (k) => (Array.isArray(raw) ? raw.find((x) => (x._id || x.status) === k)?.count || 0 : Number(raw[k]) || 0);
  const by = { TODO: bs("TODO"), IN_PROGRESS: bs("IN_PROGRESS"), DONE: bs("DONE") };
  return {
    projects: g("totalProjects", "projects", "projectsCount"),
    total: g("totalTasks", "tasks", "total", "tasksCount") || by.TODO + by.IN_PROGRESS + by.DONE,
    done: g("completedTasks", "doneTasks", "completed", "done") || by.DONE,
    inProgress: g("inProgressTasks", "inProgress") || by.IN_PROGRESS,
    overdue: g("overdueTasks", "lateTasks", "overdue", "late"),
    byStatus: by,
  };
}