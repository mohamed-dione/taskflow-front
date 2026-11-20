import { useState } from "react";
import { api, usePaged, id, label, fmtDate, rowsOf } from "../api";
import Pager from "../Pager";

const EMPTY = { name: "", description: "" };
const ownerOf = (x) => label(x.owner || x.manager || x.createdBy || x.responsible);

export default function Projets() {
  const p = usePaged("/api/projects");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fErr, setFErr] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [who, setWho] = useState("");
  const [mErr, setMErr] = useState("");
  const editing = modal && modal !== "new";
  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: "", text: "" }), 3500); };

  function openForm(x) { setForm(x ? { name: x.name || "", description: x.description || "" } : EMPTY); setFErr(""); setModal(x || "new"); }
  async function save(e) {
    e.preventDefault();
    if (form.name.trim().length < 2) return setFErr("Le nom du projet est obligatoire (2 caractères minimum).");
    try {
      await api(editing ? `/api/projects/${id(modal)}` : "/api/projects", { method: editing ? "PATCH" : "POST", body: form });
      setModal(null); flash("ok", editing ? "Projet modifié." : "Projet créé."); p.reload();
    } catch (x) { setFErr(x.message); }
  }
  async function del(x) {
    if (!window.confirm(`Supprimer le projet « ${x.name} » ?`)) return;
    try { await api(`/api/projects/${id(x)}`, { method: "DELETE" }); flash("ok", "Projet supprimé."); p.reload(); }
    catch (e) { flash("err", e.message); }
  }
  async function loadMembers(x) {
    try { setMembers(rowsOf(await api(`/api/projects/${id(x)}/members`))); setMErr(""); } catch (e) { setMErr(e.message); }
  }
  async function showDetails(x) {
    setOpen(x); setDetail(null); setMembers([]); setWho(""); setMErr(""); loadMembers(x);
    try { const d = await api(`/api/projects/${id(x)}`); setDetail(d?.data || d?.project || d); } catch (e) { setMErr(e.message); }
  }
  async function addMember(e) {
    e.preventDefault();
    if (!who.trim()) return setMErr("Saisissez l’e-mail ou l’identifiant du membre.");
    try {
      await api(`/api/projects/${id(open)}/members`, { method: "POST", body: who.includes("@") ? { email: who.trim() } : { userId: who.trim() } });
      setWho(""); loadMembers(open); p.reload();
    } catch (x) { setMErr(x.message); }
  }
  const d = detail || open;

  return (
    <div className="tf-card">
      <div className="tf-head">
        <div><h3>Projets</h3><p className="tf-sub">{p.total} projet(s) accessible(s)</p></div>
        <button className="tf-btn" onClick={() => openForm()}>+ Nouveau projet</button>
      </div>
      {msg.text && <div className={msg.type === "ok" ? "tf-ok" : "tf-err"} role="status">{msg.text}</div>}
      {p.err && <div className="tf-err" role="alert">{p.err}</div>}

      {p.loading ? <p>Chargement…</p> : p.items.length === 0 ? (
        <div className="tf-emptybox"><p>Aucun projet pour l’instant.</p><button className="tf-btn" onClick={() => openForm()}>Créer le premier projet</button></div>
      ) : (
        <div className="tf-wrap"><table className="tf-table">
          <thead><tr><th>Projet</th><th>Responsable</th><th>Membres</th><th>Créé le</th><th></th></tr></thead>
          <tbody>{p.items.map((x) => (
            <tr key={id(x)}>
              <td><b>{x.name}</b>{x.description && <><br /><small>{x.description.slice(0, 70)}</small></>}</td>
              <td>{ownerOf(x)}</td><td>{Array.isArray(x.members) ? x.members.length : "—"}</td><td>{fmtDate(x.createdAt)}</td>
              <td><div className="tf-act">
                <button className="tf-btn tf-ghost" onClick={() => showDetails(x)}>Détails et membres</button>
                <button className="tf-btn tf-ghost" onClick={() => openForm(x)}>Modifier</button>
                <button className="tf-btn tf-del" onClick={() => del(x)}>Supprimer</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      <Pager page={p.page} pages={p.pages} onChange={p.setPage} />

      {modal && (
        <div className="tf-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <form className="tf-modal tf-form" onSubmit={save} noValidate>
            <h3>{editing ? "Modifier le projet" : "Nouveau projet"}</h3>
            <label>Nom du projet<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            {fErr && <div className="tf-err" role="alert">{fErr}</div>}
            <div className="tf-actions"><button type="button" className="tf-ghost" onClick={() => setModal(null)}>Annuler</button><button>{editing ? "Enregistrer" : "Créer le projet"}</button></div>
          </form>
        </div>
      )}

      {open && (
        <div className="tf-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="tf-modal">
            <h3>{d.name}</h3>
            <dl className="tf-dl">
              <dt>Description</dt><dd>{d.description || "—"}</dd>
              <dt>Responsable</dt><dd>{ownerOf(d)}</dd>
              <dt>Créé le</dt><dd>{fmtDate(d.createdAt)}</dd>
              <dt>Modifié le</dt><dd>{fmtDate(d.updatedAt)}</dd>
            </dl>
            <h4 className="tf-h4">Membres ({members.length})</h4>
            {members.length === 0 ? <p className="tf-muted">Aucun membre.</p> : (
              <ul className="tf-list">{members.map((m, i) => <li key={id(m.user || m) || i}><span>{label(m.user || m)}<br /><small>{(m.user || m).email}</small></span><b>{m.role || ""}</b></li>)}</ul>
            )}
            <form className="tf-form" onSubmit={addMember} noValidate style={{ marginTop: 16, marginBottom: 0 }}>
              <label>Ajouter un membre<input value={who} onChange={(e) => setWho(e.target.value)} placeholder="E-mail ou identifiant de l’utilisateur" /></label>
              {mErr && <div className="tf-err" role="alert">{mErr}</div>}
              <div className="tf-actions"><button type="button" className="tf-ghost" onClick={() => setOpen(null)}>Fermer</button><button>Ajouter</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
