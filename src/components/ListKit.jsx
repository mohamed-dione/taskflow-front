// src/components/ListKit.jsx
// Hook + barre de recherche + pagination, réutilisables pour Projets, Tâches, Utilisateurs…
// Exemple complet de page : <ProjectsPage /> en bas du fichier.

import { useEffect, useState } from 'react';
// ListKit.jsx
import { API } from '../api';


/* ---------- 1. Hook : charge une liste paginée avec recherche ---------- */
export function useList(endpoint, { limit = 10, extraParams = {} } = {}) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Attend 300 ms après la dernière frappe avant d'interroger l'API
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1); // toute nouvelle recherche revient à la page 1
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const extraKey = JSON.stringify(extraParams);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ page, limit, ...(debounced && { search: debounced }), ...extraParams });

    const token = localStorage.getItem('token');

      fetch(`${API}${endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint}?${params}`, {
       headers: token ? { Authorization: `Bearer ${token}` } : {},
       signal: controller.signal,
      })
   
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || json.error?.message || 'Impossible de charger les données');
        setData(json)({
          items: json.items || json.projects || json.tasks || json.users || [],
          total: json.total ?? 0,
          totalPages: json.totalPages ?? json.Pagination?.pages ?? 1,
        });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, limit, debounced, extraKey, reloadKey]);

  return {
    ...data,
    page, setPage,
    search, setSearch,
    loading, error,
    reload: () => setReloadKey((k) => k + 1),
  };
}

/* ---------- 2. Barre de recherche ---------- */
export function SearchBar({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div style={styles.searchWrap}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={styles.searchInput}
      />
    </div>
  );
}

/* ---------- 3. Pagination ---------- */
export function Pagination({ page, totalPages, onChange, total }) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav style={styles.pager} aria-label="Pagination">
      <button type="button" style={btn(isFirst)} disabled={isFirst} onClick={() => onChange(page - 1)}>
        Précédent
      </button>
      <span style={{ color: '#1b2540' }}>
        Page <strong>{page}</strong> sur <strong>{totalPages}</strong>
        {typeof total === 'number' && <span style={{ color: '#7b86a3' }}> ({total} résultat{total > 1 ? 's' : ''})</span>}
      </span>
      <button type="button" style={btn(isLast)} disabled={isLast} onClick={() => onChange(page + 1)}>
        Suivant
      </button>
    </nav>
  );
}

/* ---------- 4. Exemple : page Projets complète ---------- */
export default function ProjectsPage({ onCreate }) {
  const { items, total, page, setPage, totalPages, search, setSearch, loading, error } = useList('/api/projects', { limit: 10 });

  return (
    <section style={styles.card}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0, color: '#1b2540' }}>Projets</h2>
          <p style={styles.muted}>{total} projet(s) accessible(s)</p>
        </div>
        <button type="button" style={styles.primary} onClick={onCreate}>+ Nouveau projet</button>
      </header>

      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un projet par nom ou description" />

      {error && <div role="alert" style={styles.error}>{error}</div>}

      {loading && <p style={styles.muted}>Chargement…</p>}

      {!loading && !error && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {search ? (
            <p style={styles.muted}>Aucun projet ne correspond à « {search} ».</p>
          ) : (
            <>
              <p style={styles.muted}>Aucun projet pour l’instant.</p>
              <button type="button" style={styles.primary} onClick={onCreate}>Créer le premier projet</button>
            </>
          )}
        </div>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((p) => (
          <li key={p._id} style={styles.row}>
            <div>
              <strong style={{ color: '#1b2540' }}>{p.name}</strong>
              <div style={styles.muted}>{p.description}</div>
            </div>
          </li>
        ))}
      </ul>

      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
    </section>
  );
}

/* ---------- Styles (couleurs alignées sur TaskFlow Admin) ---------- */
const btn = (disabled) => ({
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #e2e6f0',
  background: '#fff',
  color: disabled ? '#c3c9d9' : '#4361ee',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
});

const styles = {
  card: { background: '#fff', border: '1px solid #e2e6f0', borderRadius: 16, padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  muted: { color: '#7b86a3', fontSize: 14, margin: '4px 0 0' },
  primary: { background: '#4361ee', color: '#fff', border: 0, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
  searchWrap: { margin: '8px 0 16px' },
  searchInput: { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e6f0', fontSize: 15 },
  row: { padding: '14px 0', borderBottom: '1px solid #eef0f6' },
  error: { background: '#ffeeee', border: '1px solid #f5c2c2', color: '#b42318', borderRadius: 10, padding: 12, margin: '12px 0' },
  pager: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20, flexWrap: 'wrap' },
};