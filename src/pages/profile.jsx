import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtDate } from "../api";

export default function Parametres() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "" });
  const [info, setInfo] = useState({ role: "", createdAt: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/users/me").then((r) => {
      const u = r?.data || r?.user || r;
      setF({ name: u.name || "", email: u.email || "" });
      setInfo({ role: u.role || "", createdAt: u.createdAt || "" });
    }).catch((x) => setMsg({ type: "err", text: x.message }));
  }, []);

  async function save(e) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setMsg({ type: "err", text: "Le nom est obligatoire (2 caractères minimum)." });
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setMsg({ type: "err", text: "Adresse e-mail invalide." });
    setBusy(true);
    try {
      const r = await api("/api/users/me", { method: "PATCH", body: { name: f.name.trim(), email: f.email.trim() } });
      const u = r?.data || r?.user || r;
      localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), name: u.name || f.name, email: u.email || f.email }));
      setMsg({ type: "ok", text: "Profil mis à jour." });
    } catch (x) { setMsg({ type: "err", text: x.message }); }
    setBusy(false);
  }

  return (
    <div className="tf-card">
      <h3>Mon profil</h3>
      <p className="tf-sub">Rôle : {info.role || "—"} · Inscrit le {fmtDate(info.createdAt)}</p>
      <form className="tf-form" onSubmit={save} noValidate>
        <label>Nom complet<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label>Adresse e-mail<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        {msg.text && <div className={msg.type === "ok" ? "tf-ok" : "tf-err"} role="status">{msg.text}</div>}
        <button disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button>
        <button type="button" className="tf-ghost" onClick={() => { localStorage.clear(); nav("/login"); }}>Se déconnecter</button>
      </form>
    </div>
  );
}
