
import { useEffect, useRef, useState } from "react";
import { api, usePaged, id, label, fmtDate, rowsOf } from "../api";
import Pager from "../Pager";

const EMPTY = { name: "", description: "" };

const ownerOf = (project) =>
  label(
    project?.owner ||
    project?.manager ||
    project?.createdBy ||
    project?.responsible
  );

export default function Projets() {
  const p = usePaged("/api/projects");

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fErr, setFErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [who, setWho] = useState("");
  const [mErr, setMErr] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [deleting, setDeleting] = useState("");

  const flashTimer = useRef(null);
  const requestId = useRef(0);
  const editing = modal !== null && modal !== "new";

  useEffect(() => {
    return () => {
      clearTimeout(flashTimer.current);
      requestId.current += 1;
    };
  }, []);

  function flash(type, text) {
    clearTimeout(flashTimer.current);
    setMsg({ type, text });

    flashTimer.current = setTimeout(() => {
      setMsg({ type: "", text: "" });
    }, 3500);
  }

  function openForm(project = null) {
    setForm(
      project
        ? {
            name: project.name || "",
            description: project.description || "",
          }
        : { ...EMPTY }
    );

    setFErr("");
    setModal(project || "new");
  }

  function closeForm() {
    if (saving) return;
    setModal(null);
    setFErr("");
  }

  async function save(e) {
    e.preventDefault();

    if (saving) return;

    const name = form.name.trim();

    if (name.length < 2) {
      setFErr("Le nom du projet est obligatoire (2 caractères minimum).");
      return;
    }

    setSaving(true);
    setFErr("");

    try {
      await api(
        editing ? `/api/projects/${id(modal)}` : "/api/projects",
        {
          method: editing ? "PATCH" : "POST",
          body: {
            name,
            description: form.description.trim(),
          },
        }
      );

      setModal(null);
      setForm({ ...EMPTY });

      flash("ok", editing ? "Projet modifié avec succès." : "Projet créé avec succès.");

      await p.reload();
    } catch (error) {
      setFErr(error.message || "Impossible d'enregistrer le projet.");
    } finally {
      setSaving(false);
    }
  }

  async function del(project) {
    const projectId = id(project);

    if (!projectId || deleting) return;

    if (!window.confirm(`Supprimer le projet « ${project.name} » ?`)) {
      return;
    }

    setDeleting(projectId);

    try {
      await api(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (id(open) === projectId) {
        setOpen(null);
        setDetail(null);
      }

      flash("ok", "Projet supprimé avec succès.");
      await p.reload();
    } catch (error) {
      flash("err", error.message || "Impossible de supprimer le projet.");
    } finally {
      setDeleting("");
    }
  }

  async function loadMembers(project, currentRequest) {
    setMembersLoading(true);

    try {
      const response = await api(
        `/api/projects/${id(project)}/members`
      );

      if (requestId.current === currentRequest) {
        setMembers(rowsOf(response));
        setMErr("");
      }
    } catch (error) {
      if (requestId.current === currentRequest) {
        setMembers([]);
        setMErr(error.message || "Impossible de charger les membres.");
      }
    } finally {
      if (requestId.current === currentRequest) {
        setMembersLoading(false);
      }
    }
  }

  async function showDetails(project) {
    const currentRequest = ++requestId.current;

    setOpen(project);
    setDetail(null);
    setMembers([]);
    setWho("");
    setMErr("");
    setDetailLoading(true);

    loadMembers(project, currentRequest);

    try {
      const response = await api(`/api/projects/${id(project)}`);

      if (requestId.current !== currentRequest) return;

      setDetail(
        response?.data ||
        response?.project ||
        response
      );
    } catch (error) {
      if (requestId.current === currentRequest) {
        setMErr(error.message || "Impossible de charger le projet.");
      }
    } finally {
      if (requestId.current === currentRequest) {
        setDetailLoading(false);
      }
    }
  }

  function closeDetails() {
    requestId.current += 1;
    setOpen(null);
    setDetail(null);
    setMembers([]);
    setMErr("");
    setWho("");
  }

  async function addMember(e) {
    e.preventDefault();

    if (addingMember || !open) return;

    const value = who.trim();

    if (!value) {
      setMErr("Saisissez l'e-mail ou l'identifiant du membre.");
      return;
    }

    const projectId = id(open);

    if (!projectId) {
      setMErr("Identifiant du projet introuvable.");
      return;
    }

    setAddingMember(true);
    setMErr("");

    try {
      await api(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: value.includes("@")
          ? { email: value }
          : { userId: value },
      });

      setWho("");

      flash("ok", "Membre ajouté au projet.");

      const currentRequest = requestId.current;

      await loadMembers(open, currentRequest);
      await p.reload();
    } catch (error) {
      setMErr(error.message || "Impossible d'ajouter ce membre.");
    } finally {
      setAddingMember(false);
    }
  }

  const displayedProject = detail || open;

  return (
    <div className="tf-card">
      <div className="tf-head">
        <div>
          <h3>Projets</h3>
          <p className="tf-sub">
            {p.total} projet(s) accessible(s)
          </p>
        </div>

        <button
          className="tf-btn"
          type="button"
          onClick={() => openForm()}
        >
          + Nouveau projet
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

      {p.err && (
        <div className="tf-err" role="alert">
          {p.err}
        </div>
      )}

      {p.loading ? (
        <p>Chargement des projets...</p>
      ) : p.items.length === 0 ? (
        <div className="tf-emptybox">
          <p>Aucun projet pour l'instant.</p>

          <button
            className="tf-btn"
            type="button"
            onClick={() => openForm()}
          >
            Créer le premier projet
          </button>
        </div>
      ) : (
        <div className="tf-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Projet</th>
                <th>Responsable</th>
                <th>Membres</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {p.items.map((project) => (
                <tr key={id(project)}>
                  <td>
                    <b>{project.name}</b>

                    {project.description && (
                      <>
                        <br />
                        <small>
                          {project.description.slice(0, 70)}
                        </small>
                      </>
                    )}
                  </td>

                  <td>{ownerOf(project)}</td>

                  <td>
                    {Array.isArray(project.members)
                      ? project.members.length
                      : "—"}
                  </td>

                  <td>{fmtDate(project.createdAt)}</td>

                  <td>
                    <div className="tf-act">
                      <button
                        className="tf-btn tf-ghost"
                        type="button"
                        onClick={() => showDetails(project)}
                      >
                        Détails et membres
                      </button>

                      <button
                        className="tf-btn tf-ghost"
                        type="button"
                        onClick={() => openForm(project)}
                      >
                        Modifier
                      </button>

                      <button
                        className="tf-btn tf-del"
                        type="button"
                        disabled={deleting === id(project)}
                        onClick={() => del(project)}
                      >
                        {deleting === id(project)
                          ? "Suppression..."
                          : "Supprimer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager
        page={p.page}
        pages={p.pages}
        onChange={p.setPage}
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
              {editing ? "Modifier le projet" : "Nouveau projet"}
            </h3>

            <label>
              Nom du projet
              <input
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    name: e.target.value,
                  }))
                }
                disabled={saving}
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
                disabled={saving}
              />
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
                disabled={saving}
              >
                Annuler
              </button>

              <button type="submit" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer"
                    : "Créer le projet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {open && (
        <div
          className="tf-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}
        >
          <div className="tf-modal">
            <h3>
              {displayedProject?.name || "Détails du projet"}
            </h3>

            {detailLoading ? (
              <p>Chargement des détails...</p>
            ) : (
              <dl className="tf-dl">
                <dt>Description</dt>
                <dd>{displayedProject?.description || "—"}</dd>

                <dt>Responsable</dt>
                <dd>{ownerOf(displayedProject)}</dd>

                <dt>Créé le</dt>
                <dd>{fmtDate(displayedProject?.createdAt)}</dd>

                <dt>Modifié le</dt>
                <dd>{fmtDate(displayedProject?.updatedAt)}</dd>
              </dl>
            )}

            <h4 className="tf-h4">
              Membres ({members.length})
            </h4>

            {membersLoading ? (
              <p>Chargement des membres...</p>
            ) : members.length === 0 ? (
              <p className="tf-muted">
                Aucun membre à afficher.
              </p>
            ) : (
              <ul className="tf-list">
                {members.map((member, index) => {
                  const user = member.user || member;
                  const memberId = id(user) || index;

                  return (
                    <li key={memberId}>
                      <span>
                        {label(user)}
                        <br />
                        <small>{user.email || ""}</small>
                      </span>

                      <b>{member.role || ""}</b>
                    </li>
                  );
                })}
              </ul>
            )}

            <form
              className="tf-form"
              onSubmit={addMember}
              noValidate
              style={{ marginTop: 16, marginBottom: 0 }}
            >
              <label>
                Ajouter un membre
                <input
                  value={who}
                  onChange={(e) => {
                    setWho(e.target.value);
                    setMErr("");
                  }}
                  placeholder="E-mail ou identifiant de l'utilisateur"
                  disabled={addingMember}
                />
              </label>

              {mErr && (
                <div className="tf-err" role="alert">
                  {mErr}
                </div>
              )}

              <div className="tf-actions">
                <button
                  type="button"
                  className="tf-ghost"
                  onClick={closeDetails}
                  disabled={addingMember}
                >
                  Fermer
                </button>

                <button
                  type="submit"
                  disabled={addingMember}
                >
                  {addingMember ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
