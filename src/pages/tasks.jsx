import { useEffect, useState } from "react";
import { api, useList, usePaged, id, label, fmtDate, rowsOf } from "../api";
import Pager from "../Pager";

const STATUS = { TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Terminée" };
const PRIO = { LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute" };
// Noms des paramètres de requête attendus par l'API (à ajuster ici si votre backend en utilise d'autres)
const PARAM = { status: "status", priority: "priority", assignee: "assignedTo", search: "search", sort: "sortBy", order: "order" };
const EMPTY = { title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "", assignedTo: "" };
const FILTERS = { status: "", priority: "", assignee: "", search: "", sort: "createdAt", order: "desc" };
const st = (x) => x.status || "TODO";
const day = (d) => (d ? String(d).slice(0, 10) : "");
const refId = (v) => (v && typeof v === "object" ? id(v) : v || "");
const isLate = (x) => x.dueDate && st(x) !== "DONE" && new Date(`${day(x.dueDate)}T23:59:59`) < new Date();

export default function Taches() {
  const projects = useList("/api/projects");
  const [pj, setPj] = useState("");
  const [people, setPeople] = useState([]);
  const [fl, setFl] = useState(FILTERS);
  const [q, setQ] = useState("");
  const [showF, setShowF] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fErr, setFErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const editing = modal && modal !== "new";
  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: "", text: "" }), 3500); };

  useEffect(() => { if (!pj && projects.items[0]) setPj(id(projects.items[0])); }, [projects.items, pj]);
  useEffect(() => { const h = setTimeout(() => setFl((s) => ({ ...s, search: q })), 400); return () => clearTimeout(h); }, [q]);
  useEffect(() => {
    if (!pj) return setPeople([]);
    api(`/api/projects/${pj}/members`).then((r) => setPeople(rowsOf(r).map((m) => m.user || m))).catch(() => setPeople([]));
  }, [pj]);

  const params = Object.fromEntries(Object.entries(PARAM).map(([k, name]) => [name, fl[k]]));
  const t = usePaged(pj ? `/api/projects/${pj}/tasks` : null, params);
  const who = (v) => (!v ? "—" : typeof v === "object" ? label(v) : label(people.find((x) => id(x) === v)) );
  const setF = (k) => (e) => setFl({ ...fl, [k]: e.target.value });

  function openForm(x) {
    setForm(x ? { title: x.title || "", description: x.description || "", priority: x.priority || "MEDIUM", status: st(x), dueDate: day(x.dueDate), assignedTo: refId(x.assignedTo) } : EMPTY);
    setFErr(""); setModal(x || "new");
  }
  async function save(e) {
    e.preventDefault();
    if (form.title.trim().length < 2) return setFErr("Le titre est obligatoire (2 caractères minimum).");
    const body = { title: form.title.trim(), description: form.description, priority: form.priority, status: form.status };
    for (const k of ["dueDate", "assignedTo"]) { if (form[k]) body[k] = form[k]; else if (editing) body[k] = null; }
    setBusy(true);
    try {
      await api(editing ? `/api/tasks/${id(modal)}` : `/api/projects/${pj}/tasks`, { method: editing ? "PATCH" : "POST", body });
      setModal(null); flash("ok", editing ? "Tâche modifiée." : "Tâche créée."); t.reload();
    } catch (x) { setFErr(x.message); }
    setBusy(false);
  }
  async function run(fn, ok) { try { await fn(); flash("ok", ok); t.reload(); } catch (x) { flash("err", x.message); } }
  async function show(x) { try { const d = await api(`/api/tasks/${id(x)}`); setDetail(d?.data || d?.task || d); } catch (e) { flash("err", e.message); } }

  return (
    <div className="tf-card">
      <div className="tf-head">
        <div><h3>Tâches</h3><p className="tf-sub">{t.total} tâche(s) dans ce projet</p></div>
        <button className="tf-btn" disabled={!pj} onClick={() => openForm()}>+ Nouvelle tâche</button>
      </div>
      {msg.text && <div className={msg.type === "ok" ? "tf-ok" : "tf-err"} role="status">{msg.text}</div>}
      {(t.err || projects.err) && <div className="tf-err" role="alert">{t.err || projects.err}</div>}

      <div className="tf-form">
        <label>Projet<select value={pj} onChange={(e) => setPj(e.target.value)}>
          {projects.items.length === 0 && <option value="">Aucun projet : créez-en un d’abord</option>}
          {projects.items.map((x) => <option key={id(x)} value={id(x)}>{x.name}</option>)}</select></label>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par titre…" aria-label="Rechercher par titre" />
        <button type="button" className="tf-ghost" onClick={() => setShowF(!showF)}>{showF ? "Masquer les filtres" : "Filtres et tri"}</button>
        {showF && (<>
          <label>Statut<select value={fl.status} onChange={setF("status")}><option value="">Tous les statuts</option>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Priorité<select value={fl.priority} onChange={setF("priority")}><option value="">Toutes les priorités</option>{Object.entries(PRIO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label>Assignée à<select value={fl.assignee} onChange={setF("assignee")}><option value="">Tout le monde</option>{people.map((x) => <option key={id(x)} value={id(x)}>{x.name || x.email}</option>)}</select></label>
          <label>Trier par<select value={fl.sort} onChange={setF("sort")}><option value="createdAt">Date de création</option><option value="dueDate">Date limite</option></select></label>
          <label>Ordre<select value={fl.order} onChange={setF("order")}><option value="desc">Décroissant</option><option value="asc">Croissant</option></select></label>
          <button type="button" className="tf-ghost" onClick={() => { setFl(FILTERS); setQ(""); }}>Réinitialiser</button>
        </>)}
      </div>

      {!pj ? <div className="tf-emptybox"><p>Créez un projet pour commencer à gérer des tâches.</p></div>
        : t.loading ? <p>Chargement…</p>
        : t.items.length === 0 ? <div className="tf-emptybox"><p>Aucune tâche ne correspond.</p><button className="tf-btn" onClick={() => openForm()}>Créer une tâche</button></div>
        : (
        <div className="tf-wrap"><table className="tf-table">
          <thead><tr><th>Tâche</th><th>Statut</th><th>Priorité</th><th>Date limite</th><th>Assignée à</th><th>Créée le</th><th></th></tr></thead>
          <tbody>{t.items.map((x) => (
            <tr key={id(x)}>
              <td><b>{x.title}</b>{x.description && <><br /><small>{x.description.slice(0, 60)}</small></>}</td>
              <td><select value={st(x)} aria-label="Statut" onChange={(e) => run(() => api(`/api/tasks/${id(x)}`, { method: "PATCH", body: { status: e.target.value } }), "Statut mis à jour.")}>
                {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
              <td>{x.priority ? <span className={`tf-badge p-${x.priority}`}>{PRIO[x.priority] || x.priority}</span> : "—"}</td>
              <td className={isLate(x) ? "tf-late" : ""}>{fmtDate(x.dueDate)}{isLate(x) && <small>En retard</small>}</td>
              <td>{who(x.assignedTo)}</td><td>{fmtDate(x.createdAt)}</td>
              <td><div className="tf-act">
                <button className="tf-btn tf-ghost" onClick={() => show(x)}>Détails</button>
                <button className="tf-btn tf-ghost" onClick={() => openForm(x)}>Modifier</button>
                <button className="tf-btn tf-del" onClick={() => window.confirm(`Supprimer « ${x.title} » ?`) && run(() => api(`/api/tasks/${id(x)}`, { method: "DELETE" }), "Tâche supprimée.")}>Supprimer</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager page={t.page} pages={t.pages} onChange={t.setPage} />

      {modal && (
        <div className="tf-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="tf-modal tf-form" onSubmit={save} noValidate>
            <h3>{editing ? "Modifier la tâche" : "Nouvelle tâche"}</h3>
            <label>Titre<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Statut<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label>Priorité<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{Object.entries(PRIO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            <label>Date limite (facultative)<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
            <label>Assignée à (membre du projet)<select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Non assignée</option>{people.map((x) => <option key={id(x)} value={id(x)}>{x.name || x.email}</option>)}</select></label>
            {fErr && <div className="tf-err" role="alert">{fErr}</div>}
            <div className="tf-actions"><button type="button" className="tf-ghost" onClick={() => setModal(null)}>Annuler</button><button disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer la tâche"}</button></div>
          </form>
        </div>
      )}

      {detail && (
        <div className="tf-overlay" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div className="tf-modal">
            <h3>{detail.title}</h3>
            <dl className="tf-dl">
              <dt>Description</dt><dd>{detail.description || "—"}</dd>
              <dt>Statut</dt><dd>{STATUS[st(detail)]}</dd>
              <dt>Priorité</dt><dd>{PRIO[detail.priority] || "—"}</dd>
              <dt>Date limite</dt><dd>{fmtDate(detail.dueDate)}</dd>
              <dt>Assignée à</dt><dd>{who(detail.assignedTo)}</dd>
              <dt>Projet</dt><dd>{label(detail.project) !== "—" ? label(detail.project) : (projects.items.find((p) => id(p) === detail.project)?.name || "—")}</dd>
              <dt>Créée le</dt><dd>{fmtDate(detail.createdAt)}</dd>
              <dt>Modifiée le</dt><dd>{fmtDate(detail.updatedAt)}</dd>
            </dl>
            <div className="tf-actions"><button className="tf-ghost" onClick={() => setDetail(null)}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
