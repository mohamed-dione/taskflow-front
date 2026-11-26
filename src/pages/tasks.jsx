
import { useEffect, useRef, useState } from "react";
import {
  api,
  useList,
  usePaged,
  id,
  label,
  fmtDate,
  rowsOf,
} from "../api";
import Pager from "../Pager";

const STATUS = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
};

const PRIO = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const PARAM = {
  status: "status",
  priority: "priority",
  assignee: "assignedTo",
  search: "search",
  sort: "sortBy",
  order: "order",
};

const EMPTY = {
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "TODO",
  dueDate: "",
  assignedTo: "",
};

const FILTERS = {
  status: "",
  priority: "",
  assignee: "",
  search: "",
  sort: "createdAt",
  order: "desc",
};

const st = (task) => task?.status || "TODO";

const day = (date) =>
  date ? String(date).slice(0, 10) : "";

const refId = (value) =>
  value && typeof value === "object"
    ? id(value)
    : value || "";

const isLate = (task) =>
  task?.dueDate &&
  st(task) !== "DONE" &&
  new Date(`${day(task.dueDate)}T23:59:59`) < new Date();

export default function Taches() {
  const projects = useList("/api/projects");

  const [pj, setPj] = useState("");
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  const [fl, setFl] = useState({ ...FILTERS });
  const [q, setQ] = useState("");
  const [showF, setShowF] = useState(false);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [fErr, setFErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [actionBusy, setActionBusy] = useState("");

  const flashTimer = useRef(null);
  const peopleRequest = useRef(0);
  const detailRequest = useRef(0);

  const editing = modal !== null && modal !== "new";

  // Nettoyage des temporisateurs et invalidation des requêtes.
  useEffect(() => {
    return () => {
      clearTimeout(flashTimer.current);
      peopleRequest.current += 1;
      detailRequest.current += 1;
    };
  }, []);

  // Sélection automatique du premier projet disponible.
  useEffect(() => {
    if (!pj && projects.items.length > 0) {
      setPj(id(projects.items[0]));
    }
  }, [projects.items, pj]);

  // Recherche avec délai pour éviter une requête à chaque caractère.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFl((previous) => ({
        ...previous,
        search: q,
      }));
    }, 400);

    return () => clearTimeout(timer);
  }, [q]);

  // Chargement des membres du projet sélectionné.
  useEffect(() => {
    const currentRequest = ++peopleRequest.current;
    let cancelled = false;

    setPeople([]);
    setPeopleLoading(false);

    if (!pj) return;

    async function loadPeople() {
      setPeopleLoading(true);

      try {
        const response = await api(`/api/projects/${pj}/members`);

        if (
          !cancelled &&
          peopleRequest.current === currentRequest
        ) {
          setPeople(
            rowsOf(response).map((member) => member.user || member)
          );
        }
      } catch {
        if (
          !cancelled &&
          peopleRequest.current === currentRequest
        ) {
          setPeople([]);
        }
      } finally {
        if (
          !cancelled &&
          peopleRequest.current === currentRequest
        ) {
          setPeopleLoading(false);
        }
      }
    }

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, [pj]);

  // Paramètres envoyés à l'API.
  const params = Object.fromEntries(
    Object.entries(PARAM).map(([key, name]) => [
      name,
      fl[key],
    ])
  );

  const t = usePaged(
    pj ? `/api/projects/${pj}/tasks` : null,
    params
  );

  const taskItems = Array.isArray(t.items) ? t.items : [];

  function who(value) {
    if (!value) return "—";

    if (typeof value === "object") {
      return label(value);
    }

    const person = people.find(
      (item) => id(item) === value
    );

    return person ? label(person) : "—";
  }

  function setFilter(key) {
    return (e) => {
      setFl((previous) => ({
        ...previous,
        [key]: e.target.value,
      }));
    };
  }

  function flash(type, text) {
    clearTimeout(flashTimer.current);

    setMsg({ type, text });

    flashTimer.current = setTimeout(() => {
      setMsg({ type: "", text: "" });
    }, 3500);
  }

  function openForm(task = null) {
    setForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "MEDIUM",
            status: st(task),
            dueDate: day(task.dueDate),
            assignedTo: refId(task.assignedTo),
          }
        : { ...EMPTY }
    );

    setFErr("");
    setModal(task || "new");
  }

  function closeForm() {
    if (busy) return;

    setModal(null);
    setFErr("");
  }

  async function save(e) {
    e.preventDefault();

    if (busy) return;

    const title = form.title.trim();

    if (title.length < 2) {
      setFErr("Le titre est obligatoire (2 caractères minimum).");
      return;
    }

    if (!pj) {
      setFErr("Sélectionnez un projet avant de créer une tâche.");
      return;
    }

    const body = {
      title,
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
    };

    if (form.dueDate) {
      body.dueDate = form.dueDate;
    } else if (editing) {
      body.dueDate = null;
    }

    if (form.assignedTo) {
      body.assignedTo = form.assignedTo;
    } else if (editing) {
      body.assignedTo = null;
    }

    setBusy(true);
    setFErr("");

    try {
      await api(
        editing
          ? `/api/tasks/${id(modal)}`
          : `/api/projects/${pj}/tasks`,
        {
          method: editing ? "PATCH" : "POST",
          body,
        }
      );

      setModal(null);
      setForm({ ...EMPTY });

      flash(
        "ok",
        editing
          ? "Tâche modifiée avec succès."
          : "Tâche créée avec succès."
      );

      await t.reload();
    } catch (error) {
      setFErr(
        error.message || "Impossible d'enregistrer la tâche."
      );
    } finally {
      setBusy(false);
    }
  }

  // Exécute une action avec verrouillage et gestion des erreurs.
  async function run(key, action, successMessage) {
    if (actionBusy) return false;

    setActionBusy(key);

    try {
      await action();

      flash("ok", successMessage);
      await t.reload();

      return true;
    } catch (error) {
      flash(
        "err",
        error.message || "Une erreur est survenue."
      );

      return false;
    } finally {
      setActionBusy("");
    }
  }

  // Consultation des détails d'une tâche.
  async function show(task) {
    const currentRequest = ++detailRequest.current;

    setDetail(null);
    setDetailLoading(true);

    try {
      const response = await api(`/api/tasks/${id(task)}`);

      if (detailRequest.current !== currentRequest) return;

      setDetail(
        response?.data ||
        response?.task ||
        response
      );
    } catch (error) {
      if (detailRequest.current === currentRequest) {
        flash("err", error.message || "Impossible de charger la tâche.");
      }
    } finally {
      if (detailRequest.current === currentRequest) {
        setDetailLoading(false);
      }
    }
  }

  function closeDetails() {
    detailRequest.current += 1;
    setDetail(null);
    setDetailLoading(false);
  }

  async function changeStatus(task, newStatus) {
    const taskId = id(task);

    await run(
      `status-${taskId}`,
      () =>
        api(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: { status: newStatus },
        }),
      "Statut mis à jour."
    );
  }

  async function removeTask(task) {
    const taskId = id(task);

    if (!taskId || actionBusy) return;

    if (!window.confirm(`Supprimer « ${task.title} » ?`)) {
      return;
    }

    const deleted = await run(
      `delete-${taskId}`,
      () =>
        api(`/api/tasks/${taskId}`, {
          method: "DELETE",
        }),
      "Tâche supprimée."
    );

    if (deleted && detail && id(detail) === taskId) {
      closeDetails();
    }
  }

  function resetFilters() {
    setFl({ ...FILTERS });
    setQ("");
  }

  const selectedProject = projects.items.find(
    (project) => id(project) === pj
  );

  const detailProjectId = refId(detail?.project);

  const detailProject =
    selectedProject && id(selectedProject) === detailProjectId
      ? selectedProject
      : projects.items.find(
          (project) => id(project) === detailProjectId
        );

  return (
    <div className="tf-card">
      <div className="tf-head">
        <div>
          <h3>Tâches</h3>
          <p className="tf-sub">
            {t.total} tâche(s) dans ce projet
          </p>
        </div>

        <button
          className="tf-btn"
          type="button"
          disabled={!pj}
          onClick={() => openForm()}
        >
          + Nouvelle tâche
        </button>
      </div>

      {msg.text && (
        <div
          className={msg.type === "ok" ? "tf-ok" : "tf-err"}
          role="status"
        >
          {msg.text}
        </div>
      )}

      {(t.err || projects.err) && (
        <div className="tf-err" role="alert">
          {t.err || projects.err}
        </div>
      )}

      <div className="tf-form">
        <label>
          Projet
          <select
            value={pj}
            onChange={(e) => setPj(e.target.value)}
          >
            {projects.items.length === 0 && (
              <option value="">
                Aucun projet : créez-en un d'abord
              </option>
            )}

            {projects.items.map((project) => (
              <option
                key={id(project)}
                value={id(project)}
              >
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par titre…"
          aria-label="Rechercher par titre"
        />

        <button
          type="button"
          className="tf-ghost"
          onClick={() => setShowF((value) => !value)}
        >
          {showF ? "Masquer les filtres" : "Filtres et tri"}
        </button>

        {showF && (
          <>
            <label>
              Statut
              <select
                value={fl.status}
                onChange={setFilter("status")}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priorité
              <select
                value={fl.priority}
                onChange={setFilter("priority")}
              >
                <option value="">Toutes les priorités</option>
                {Object.entries(PRIO).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Assignée à
              <select
                value={fl.assignee}
                onChange={setFilter("assignee")}
              >
                <option value="">Tout le monde</option>
                {people.map((person) => (
                  <option key={id(person)} value={id(person)}>
                    {person.name || person.email}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Trier par
              <select
                value={fl.sort}
                onChange={setFilter("sort")}
              >
                <option value="createdAt">Date de création</option>
                <option value="dueDate">Date limite</option>
              </select>
            </label>

            <label>
              Ordre
              <select
                value={fl.order}
                onChange={setFilter("order")}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </label>

            <button
              type="button"
              className="tf-ghost"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </>
        )}
      </div>

      {!pj ? (
        <div className="tf-emptybox">
          <p>Créez un projet pour commencer à gérer des tâches.</p>
        </div>
      ) : t.loading ? (
        <p>Chargement des tâches...</p>
      ) : taskItems.length === 0 ? (
        <div className="tf-emptybox">
          <p>Aucune tâche ne correspond.</p>

          <button
            className="tf-btn"
            type="button"
            onClick={() => openForm()}
          >
            Créer une tâche
          </button>
        </div>
      ) : (
        <div className="tf-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Date limite</th>
                <th>Assignée à</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {taskItems.map((task) => {
                const taskId = id(task);
                const statusBusy = actionBusy === `status-${taskId}`;
                const deleteBusy = actionBusy === `delete-${taskId}`;

                return (
                  <tr key={taskId}>
                    <td>
                      <b>{task.title}</b>
                      {task.description && (
                        <>
                          <br />
                          <small>
                            {task.description.slice(0, 60)}
                          </small>
                        </>
                      )}
                    </td>

                    <td>
                      <select
                        value={st(task)}
                        aria-label={`Statut de ${task.title}`}
                        disabled={Boolean(actionBusy)}
                        onChange={(e) =>
                          changeStatus(task, e.target.value)
                        }
                      >
                        {Object.entries(STATUS).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ))}
                      </select>
                      {statusBusy && <small>Mise à jour...</small>}
                    </td>

                    <td>
                      {task.priority ? (
                        <span className={`tf-badge p-${task.priority}`}>
                          {PRIO[task.priority] || task.priority}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className={isLate(task) ? "tf-late" : ""}>
                      {fmtDate(task.dueDate)}
                      {isLate(task) && (
                        <>
                          <br />
                          <small>En retard</small>
                        </>
                      )}
                    </td>

                    <td>{who(task.assignedTo)}</td>
                    <td>{fmtDate(task.createdAt)}</td>

                    <td>
                      <div className="tf-act">
                        <button
                          className="tf-btn tf-ghost"
                          type="button"
                          onClick={() => show(task)}
                        >
                          Détails
                        </button>

                        <button
                          className="tf-btn tf-ghost"
                          type="button"
                          disabled={Boolean(actionBusy)}
                          onClick={() => openForm(task)}
                        >
                          Modifier
                        </button>

                        <button
                          className="tf-btn tf-del"
                          type="button"
                          disabled={Boolean(actionBusy)}
                          onClick={() => removeTask(task)}
                        >
                          {deleteBusy ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager
        page={t.page}
        pages={t.pages}
        onChange={t.setPage}
      />

      {modal && (
        <div
          className="tf-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <form
            className="tf-modal tf-form"
            onSubmit={save}
            noValidate
          >
            <h3>
              {editing ? "Modifier la tâche" : "Nouvelle tâche"}
            </h3>

            <label>
              Titre
              <input
                autoFocus
                value={form.title}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    title: e.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>

            <label>
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    description: e.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>

            <label>
              Statut
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    status: e.target.value,
                  }))
                }
                disabled={busy}
              >
                {Object.entries(STATUS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Priorité
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    priority: e.target.value,
                  }))
                }
                disabled={busy}
              >
                {Object.entries(PRIO).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date limite (facultative)
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    dueDate: e.target.value,
                  }))
                }
                disabled={busy}
              />
            </label>

            <label>
              Assignée à (membre du projet)
              <select
                value={form.assignedTo}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    assignedTo: e.target.value,
                  }))
                }
                disabled={busy || peopleLoading}
              >
                <option value="">Non assignée</option>

                {people.map((person) => (
                  <option key={id(person)} value={id(person)}>
                    {person.name || person.email}
                  </option>
                ))}
              </select>
            </label>

            {fErr && (
              <div className="tf-err" role="alert">
                {fErr}
              </div>
            )}

            <div className="tf-actions">
              <button
                type="button"
                className="tf-ghost"
                onClick={closeForm}
                disabled={busy}
              >
                Annuler
              </button>

              <button type="submit" disabled={busy}>
                {busy
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer"
                    : "Créer la tâche"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailLoading && (
        <div className="tf-overlay">
          <div className="tf-modal">
            <p>Chargement des détails de la tâche...</p>
          </div>
        </div>
      )}

      {detail && (
        <div
          className="tf-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="tf-modal">
            <h3>{detail.title}</h3>

            <dl className="tf-dl">
              <dt>Description</dt>
              <dd>{detail.description || "—"}</dd>

              <dt>Statut</dt>
              <dd>{STATUS[st(detail)] || st(detail)}</dd>

              <dt>Priorité</dt>
              <dd>{PRIO[detail.priority] || "—"}</dd>

              <dt>Date limite</dt>
              <dd>{fmtDate(detail.dueDate)}</dd>

              <dt>Assignée à</dt>
              <dd>{who(detail.assignedTo)}</dd>

              <dt>Projet</dt>
              <dd>
                {label(detail.project) !== "—"
                  ? label(detail.project)
                  : detailProject?.name || "—"}
              </dd>

              <dt>Créée le</dt>
              <dd>{fmtDate(detail.createdAt)}</dd>

              <dt>Modifiée le</dt>
              <dd>{fmtDate(detail.updatedAt)}</dd>
            </dl>

            <div className="tf-actions">
              <button
                type="button"
                className="tf-ghost"
                onClick={closeDetails}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
