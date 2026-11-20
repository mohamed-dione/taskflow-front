import { useStats, normStats } from "../api";
import { Donut, HBars, Num, STATUS_FR, STATUS_COLORS } from "../components/Charts";

export default function Statistiques() {
  const { data, err, loading } = useStats();
  if (loading) return <div className="tf-card"><p>Chargement…</p></div>;
  const s = normStats(data || {});
  const rate = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const byStatus = Object.entries(STATUS_FR).map(([k, l]) => [l, s.byStatus[k]]);
  const kpis = [[s.projects, "Projets accessibles"], [s.total, "Tâches"], [s.done, "Terminées"], [s.inProgress, "En cours"], [s.overdue, "En retard"]];

  return (
    <div className="tf-stack">
      {err && <div className="tf-err" role="alert">{err}</div>}
      <div className="tf-grid">{kpis.map(([n, l]) => <div className="tf-stat" key={l}><b><Num value={n} /></b><span>{l}</span></div>)}</div>
      <div className="tf-2col">
        <div className="tf-card"><h3>Répartition par statut</h3><p className="tf-sub">À faire, en cours, terminées</p><Donut data={byStatus} colors={STATUS_COLORS} /></div>
        <div className="tf-card"><h3>Taux d’achèvement</h3><p className="tf-sub">Tâches terminées sur le total</p>
          <Donut data={[["Terminées", s.done], ["Restantes", Math.max(s.total - s.done, 0)]]} colors={["#10b981", "#cbd5e1"]} center={`${rate} %`} /></div>
      </div>
      <div className="tf-card"><h3>Vue comparée</h3><p className="tf-sub">Projets, tâches, terminées, en cours, en retard</p>
        <HBars data={[["Projets", s.projects], ["Tâches", s.total], ["Terminées", s.done], ["En cours", s.inProgress], ["En retard", s.overdue]]} /></div>
      <details className="tf-card"><summary>Réponse brute de GET /api/dashboard/stats</summary><pre className="tf-pre">{JSON.stringify(data, null, 2)}</pre></details>
    </div>
  );
}
