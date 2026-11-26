
import { useStats, normStats } from "../api";
import {
  Donut,
  HBars,
  Num,
  STATUS_FR,
  STATUS_COLORS,
} from "../components/Charts";

const PRIORITY_FR = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

export default function Statistiques() {
  const { data, err, loading } = useStats();
  const s = normStats(data || {});

  const projects = Math.max(0, Number(s.projects) || 0);
  const total = Math.max(0, Number(s.total) || 0);
  const done = Math.max(0, Number(s.done) || 0);
  const inProgress = Math.max(0, Number(s.inProgress) || 0);
  const overdue = Math.max(0, Number(s.overdue) || 0);
  const todo = Math.max(0, Number(s.todo) || 0);

  const rate = Math.min(
    100,
    Math.max(0, Number(s.completionRate) ||
      (total > 0 ? (done / total) * 100 : 0))
  );

  const byStatus = Object.entries(STATUS_FR).map(([key, label]) => [
    label,
    Math.max(0, Number(s.byStatus?.[key]) || 0),
  ]);

  const byPriority = Object.entries(PRIORITY_FR).map(([key, label]) => [
    label,
    Math.max(0, Number(s.byPriority?.[key]) || 0),
  ]);

  const recentTasks = Array.isArray(s.recentTasks) ? s.recentTasks : [];
  const byProject = Array.isArray(s.byProject) ? s.byProject : [];

  const kpis = [
    [projects, "Projets accessibles"],
    [total, "Tâches au total"],
    [done, "Tâches terminées"],
    [inProgress, "Tâches en cours"],
    [todo, "Tâches à faire"],
    [overdue, "Tâches en retard"],
  ];

  if (loading) {
    return <div className="tf-card">Chargement des statistiques…</div>;
  }

  return (
    <div className="tf-stack">
      <div className="tf-card">
        <h3>Statistiques et rapports</h3>
        <p className="tf-sub">
          Vue d'ensemble des projets et des tâches enregistrés.
        </p>
      </div>

      {err && (
        <div className="tf-err" role="alert">
          Impossible de récupérer les statistiques : {err}
        </div>
      )}

      <div className="tf-grid">
        {kpis.map(([value, label]) => (
          <div className="tf-stat" key={label}>
            <b><Num value={value} /></b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="tf-2col">
        <div className="tf-card">
          <h3>Répartition par statut</h3>
          <Donut data={byStatus} colors={STATUS_COLORS} />
        </div>

        <div className="tf-card">
          <h3>Répartition par priorité</h3>
          <Donut data={byPriority} />
        </div>

        <div className="tf-card">
          <h3>Taux d'achèvement</h3>
          <Donut
            data={[
              ["Terminées", done],
              ["Restantes", Math.max(total - done, 0)],
            ]}
            colors={["#10b981", "#cbd5e1"]}
            center={`${Math.round(rate)} %`}
          />
          <p className="tf-sub">
            {done} tâche(s) terminée(s) sur {total}
          </p>
        </div>

        <div className="tf-card">
          <h3>Comparaison des indicateurs</h3>
          <HBars
            data={[
              ["Projets", projects],
              ["Tâches", total],
              ["Terminées", done],
              ["En cours", inProgress],
              ["À faire", todo],
              ["En retard", overdue],
            ]}
          />
        </div>
      </div>

      <div className="tf-card">
        <h3>Statistiques par projet</h3>
        {byProject.length === 0 ? (
          <p>Aucune statistique par projet disponible.</p>
        ) : (
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Total</th>
                  <th>Terminées</th>
                  <th>En cours</th>
                  <th>À faire</th>
                </tr>
              </thead>
              <tbody>
                {byProject.map((p, index) => (
                  <tr key={p.projectId || p._id || index}>
                    <td>{p.name || p.projectName || "Projet"}</td>
                    <td>{p.totalTasks ?? p.total ?? 0}</td>
                    <td>{p.doneTasks ?? p.done ?? 0}</td>
                    <td>{p.inProgressTasks ?? p.inProgress ?? 0}</td>
                    <td>{p.todoTasks ?? p.todo ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="tf-card">
        <h3>Tâches récentes</h3>
        {recentTasks.length === 0 ? (
          <p>Aucune tâche récente disponible.</p>
        ) : (
          <div className="tf-table-wrap">
            <table className="tf-table">
              <thead>
                <tr>
                  <th>Tâche</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task, index) => (
                  <tr key={task._id || task.id || index}>
                    <td>{task.title || "Sans titre"}</td>
                    <td>{STATUS_FR[task.status] || task.status || "—"}</td>
                    <td>{PRIORITY_FR[task.priority] || task.priority || "—"}</td>
                    <td>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <details className="tf-card">
        <summary>Consulter la réponse brute de l'API</summary>
        <pre className="tf-pre">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}
