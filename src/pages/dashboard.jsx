
import { Link } from "react-router-dom";
import { useStats, normStats, API_DOCS } from "../api";
import {
  Donut,
  Num,
  STATUS_FR,
  STATUS_COLORS,
} from "../components/Charts";

export default function Dashboard() {
  const { data, err, loading } = useStats();

  if (loading && !data) {
    return (
      <div className="tf-card">
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  const s = normStats(data || {});

  const total = Math.max(Number(s.total) || 0, 0);
  const done = Math.max(Number(s.done) || 0, 0);
  const remaining = Math.max(total - done, 0);

  const rate = total
    ? Math.min(Math.round((done / total) * 100), 100)
    : 0;

  const kpis = [
    [s.projects, "Projets"],
    [total, "Tâches"],
    [s.inProgress, "En cours"],
    [done, "Terminées"],
    [s.overdue, "En retard"],
    [`${rate} %`, "Taux d’achèvement"],
  ];

  const byStatus = Object.entries(STATUS_FR).map(([key, label]) => [
    label,
    Number(s.byStatus?.[key]) || 0,
  ]);

  return (
    <div className="tf-stack">
      {err && (
        <div className="tf-err" role="alert">
          Impossible de récupérer toutes les statistiques : {err}
        </div>
      )}

      <div className="tf-grid">
        {kpis.map(([value, label]) => (
          <div className="tf-stat" key={label}>
            <b>
              <Num value={value} />
            </b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="tf-2col">
        <div className="tf-card">
          <h3>Répartition par statut</h3>
          <p className="tf-sub">
            Données réelles de l'API
          </p>

          <Donut
            data={byStatus}
            colors={STATUS_COLORS}
          />
        </div>

        <div className="tf-card">
          <h3>Taux d’achèvement</h3>
          <p className="tf-sub">
            Tâches terminées sur le nombre total de tâches
          </p>

          <Donut
            data={[
              ["Terminées", done],
              ["Restantes", remaining],
            ]}
            colors={["#10b981", "#cbd5e1"]}
            center={`${rate} %`}
          />
        </div>
      </div>

      <div className="tf-card">
        <h3>Accès rapide</h3>
        <p className="tf-sub">
          Accédez aux différents modules de TaskFlow.
        </p>

        <Link className="tf-link-btn" to="/projets">
          Projets et membres
        </Link>

        <Link className="tf-link-btn" to="/taches">
          Gestion des tâches
        </Link>

        <Link className="tf-link-btn" to="/statistiques">
          Statistiques détaillées
        </Link>

        <Link className="tf-link-btn" to="/parametres">
          Mon profil
        </Link>

        <a
          className="tf-link-btn"
          href={API_DOCS}
          target="_blank"
          rel="noreferrer"
        >
          Documentation Swagger
        </a>
      </div>
    </div>
  );
}
