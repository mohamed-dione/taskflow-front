import { Link } from "react-router-dom";
import { useStats, normStats } from "../api";
import { Donut, Num, STATUS_FR, STATUS_COLORS } from "../components/Charts";

export default function Dashboard() {
  const { data, err, loading } = useStats();
  if (loading) return <div className="tf-card"><p>Chargement…</p></div>;
  const s = normStats(data || {});
  const rate = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const kpis = [[s.projects, "Projets"], [s.total, "Tâches"], [s.inProgress, "En cours"], [s.done, "Terminées"], [s.overdue, "En retard"], [`${rate} %`, "Taux d’achèvement"]];
  const byStatus = Object.entries(STATUS_FR).map(([k, l]) => [l, s.byStatus[k]]);

  return (
    <div className="tf-stack">
      {err && <div className="tf-err" role="alert">{err}</div>}
      <div className="tf-grid">{kpis.map(([n, l]) => <div className="tf-stat" key={l}><b><Num value={n} /></b><span>{l}</span></div>)}</div>
      <div className="tf-2col">
        <div className="tf-card"><h3>Répartition par statut</h3><p className="tf-sub">Données de /api/dashboard/stats</p><Donut data={byStatus} colors={STATUS_COLORS} /></div>
        <div className="tf-card"><h3>Taux d’achèvement</h3><p className="tf-sub">Tâches terminées sur le total</p>
          <Donut data={[["Terminées", s.done], ["Restantes", Math.max(s.total - s.done, 0)]]} colors={["#10b981", "#cbd5e1"]} center={`${rate} %`} /></div>
      </div>
      <div className="tf-card">
        <h3>Accès rapide</h3><p className="tf-sub">Testez chaque module</p>
        <Link className="tf-link-btn" to="/projets">Projets et membres</Link>
        <Link className="tf-link-btn" to="/taches">Tâches</Link>
        <Link className="tf-link-btn" to="/statistiques">Statistiques</Link>
        <Link className="tf-link-btn" to="/parametres">Mon profil</Link>
        <a className="tf-link-btn" href={`${import.meta.env.VITE_API_URL}/api-docs`} target="_blank" rel="noreferrer">Documentation Swagger</a>
      </div>
    </div>
  );
}
