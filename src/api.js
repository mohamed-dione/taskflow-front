import { useCallback, useEffect, useRef, useState } from "react";

// URL du backend : accepte une URL avec ou sans /api final.
const RAW_API = import.meta.env.VITE_API_URL || "https://taskflow-backend-7yfk.onrender.com";

const NORMALIZED_API = RAW_API.trim().replace(/\/+$/, "");

export const API = NORMALIZED_API;
export const API_ROOT = NORMALIZED_API.replace(/\/api$/i, "");
export const API_DOCS = `${API_ROOT}/api-docs`;

export const PER = 8;

// Construit une URL sans doubler le préfixe /api.
function getApiPath(path) {
  const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;

  if (/\/api$/i.test(API) && /^\/api(?:\/|$)/i.test(cleanPath)) {
    return cleanPath.replace(/^\/api/i, "") || "/";
  }

  return cleanPath;
}

// Extrait une liste depuis les formats de réponse habituels.
export function rowsOf(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const candidates = [
    response.data,
    response.items,
    response.results,
    response.tasks,
    response.projects,
    response.users,
    response.members,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }

  if (response.data && typeof response.data === "object") {
    return rowsOf(response.data);
  }

  return [];
}

export const toList = rowsOf;

export const id = (value) =>
  value?._id || value?.id || value?.userId || "";

export const label = (value) =>
  value && typeof value === "object"
    ? value.name || value.title || value.email || "—"
    : value || "—";

export const fmtDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
};

export const count = (items, getKey) =>
  (Array.isArray(items) ? items : []).reduce((result, item) => {
    const key = getKey(item) || "—";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

export const pid = (task) => {
  const project = task?.project;
  return project && typeof project === "object"
    ? id(project)
    : project || "";
};

// Client HTTP centralisé.
export async function api(path, { method = "GET", body, params, headers = {} } = {}) {
  const token = localStorage.getItem("token");
  const url = new URL(`${API}${getApiPath(path)}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => "");
      data = text ? { message: text } : null;
    }
  }

  if (response.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      data?.error ||
      `Erreur HTTP ${response.status}`;

    throw new Error(
      typeof message === "string" ? message : `Erreur HTTP ${response.status}`
    );
  }

  return data;
}

// Chargement d'une liste complète.
export function useList(path) {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setLoading(true);

    try {
      const response = await api(path, {
        params: { limit: 1000 },
      });

      if (currentRequest !== requestId.current) return;

      setItems(rowsOf(response));
      setErr("");
    } catch (error) {
      if (currentRequest !== requestId.current) return;

      setErr(error.message);
      setItems([]);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    load();

    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return { items, err, setErr, loading, load, reload: load };
}

// Chargement paginé avec filtres et tri.
export function usePaged(path, params = {}) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    items: [],
    pages: 1,
    total: 0,
    loading: true,
    err: "",
  });

  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;

    if (!path) {
      setState({
        items: [],
        pages: 1,
        total: 0,
        loading: false,
        err: "",
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      err: "",
    }));

    try {
      const response = await api(path, {
        params: {
          ...params,
          page,
          limit: PER,
        },
      });

      if (currentRequest !== requestId.current) return;

      const allItems = rowsOf(response);
      const pagination =
        response?.pagination ||
        response?.meta?.pagination ||
        response?.data?.pagination;

      if (pagination) {
        setState({
          items: allItems,
          pages: Math.max(
            1,
            Number(pagination.pages || pagination.totalPages) || 1
          ),
          total: Number(pagination.total ?? allItems.length),
          loading: false,
          err: "",
        });
      } else {
        const total = allItems.length;

        setState({
          items: allItems.slice((page - 1) * PER, page * PER),
          pages: Math.max(1, Math.ceil(total / PER)),
          total,
          loading: false,
          err: "",
        });
      }
    } catch (error) {
      if (currentRequest !== requestId.current) return;

      setState({
        items: [],
        pages: 1,
        total: 0,
        loading: false,
        err: error.message,
      });
    }
  }, [path, paramsKey, page]);

  useEffect(() => {
    setPage(1);
  }, [path, paramsKey]);

  useEffect(() => {
    load();

    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return {
    ...state,
    page,
    setPage,
    reload: load,
  };
}

// Statistiques du tableau de bord.
export function useStats() {
  const [state, setState] = useState({
    data: null,
    err: "",
    loading: true,
  });

  const load = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      loading: true,
      err: "",
    }));

    try {
      const response = await api("/api/dashboard/stats");

      setState({
        data: response?.data ?? response,
        err: "",
        loading: false,
      });
    } catch (error) {
      setState({
        data: null,
        err: error.message,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

// Uniformise les différentes structures de statistiques possibles.
export function normStats(data = {}) {
  const root = data?.data || data || {};
  const tasks =
    root.tasks && typeof root.tasks === "object" && !Array.isArray(root.tasks)
      ? root.tasks
      : {};

  const readNumber = (...keys) => {
    for (const key of keys) {
      const value = root[key] ?? tasks[key];

      if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
        return Number (value);
      }
    }
    return 0;
  };


  const rawStatus =
    root.byStatus ||
    root.tasksByStatus ||
    root.statusDistribution ||
    tasks.byStatus ||
    {};

  const readStatus = (status) => {
    if (Array.isArray(rawStatus)) {
      const entry = rawStatus.find(
        (item) => (item._id || item.status || item.name) === status
      );

      return Number(entry?.count ?? entry?.total ?? entry?.value) || 0;
    }

    return Number(rawStatus?.[status]) || 0;
  };

  const byStatus = {
    TODO: readStatus("TODO"),
    IN_PROGRESS: readStatus("IN_PROGRESS"),
    DONE: readStatus("DONE"),
  };

  const totalFromStatus =
    byStatus.TODO + byStatus.IN_PROGRESS + byStatus.DONE;

  const done = readNumber(
    "completedTasks",
    "doneTasks",
    "completed",
    "done"
  ) || byStatus.DONE;

  const inProgress = readNumber(
    "inProgressTasks",
    "inProgress"
  ) || byStatus.IN_PROGRESS;

  const total = readNumber(
    "totalTasks",
    "total",
    "tasksCount"
  ) || (typeof root.tasks === "number" ? root.tasks : totalFromStatus);

  return {
    projects: readNumber(
      "totalProjects",
      "projectsCount",
      "projects"
    ),
    total,
    done,
    inProgress,
    overdue: readNumber(
      "overdueTasks",
      "lateTasks",
      "overdue",
      "late"
    ),
    byStatus,
  };
}
