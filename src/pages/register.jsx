import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (localStorage.getItem("token")) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (f.name.trim().length < 2) return setErr("Saisissez votre nom complet.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Adresse e-mail invalide.");
    if (f.password.length < 6) return setErr("Le mot de passe doit contenir au moins 6 caractères.");
    if (f.password !== f.confirm) return setErr("Les mots de passe ne correspondent pas.");
    setBusy(true);
    try {
      const d = await api("/api/auth/register", {
        method: "POST",
        body: { name: f.name.trim(), email: f.email.trim(), password: f.password },
      });
      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify(d.user));
      nav("/dashboard");
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <div className="tf-card" style={{ maxWidth: 420, margin: "10vh auto" }}>
      <h3>Créer un compte</h3>
      <p className="tf-sub">Créez votre compte pour rejoindre TaskFlow.</p>
      <form className="tf-form" onSubmit={submit} noValidate>
        <label>Nom complet<input value={f.name} onChange={set("name")} autoComplete="name" /></label>
        <label>Adresse e-mail<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
        <label>Mot de passe<input type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></label>
        <label>Confirmer le mot de passe<input type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></label>
        {err && <div className="tf-err" role="alert">{err}</div>}
        <button disabled={busy}>{busy ? "Veuillez patienter…" : "Créer mon compte"}</button>
      </form>
      <p className="tf-sub" style={{ textAlign: "center", marginBottom: 0 }}>
        Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}