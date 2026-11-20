import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";

// <Login /> = connexion, <Login register /> = création de compte
export default function Login({ register = false }) {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (localStorage.getItem("token")) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (register && f.name.trim().length < 2) return setErr("Saisissez votre nom complet.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Adresse e-mail invalide.");
    if (f.password.length < 6) return setErr("Le mot de passe doit contenir au moins 6 caractères.");
    setBusy(true);
    try {
      const body = register ? f : { email: f.email, password: f.password };
      const d = await api(`/api/auth/${register ? "register" : "login"}`, { method: "POST", body });
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
      <h3>{register ? "Créer un compte" : "Se connecter"}</h3>
      <p className="tf-sub">{register ? "Créez votre compte pour rejoindre TaskFlow." : "Accédez à votre espace d’administration."}</p>
      <form className="tf-form" onSubmit={submit} noValidate>
        {register && <label>Nom complet<input value={f.name} onChange={set("name")} autoComplete="name" /></label>}
        <label>Adresse e-mail<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /></label>
        <label>Mot de passe<input type="password" value={f.password} onChange={set("password")} autoComplete={register ? "new-password" : "current-password"} /></label>
        {err && <div className="tf-err" role="alert">{err}</div>}
        <button disabled={busy}>{busy ? "Veuillez patienter…" : register ? "Créer mon compte" : "Me connecter"}</button>
      </form>
      <p className="tf-sub" style={{ textAlign: "center", marginBottom: 0 }}>
        {register ? <>Vous avez déjà un compte ? <Link to="/login">Se connecter</Link></> : <>Pas encore de compte ? <Link to="/register">Créer un compte</Link></>}
      </p>
    </div>
  );
}