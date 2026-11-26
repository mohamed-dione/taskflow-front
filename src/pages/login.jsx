
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login({ register = false }) {
  const nav = useNavigate();

  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setF((previous) => ({
      ...previous,
      [key]: e.target.value,
    }));
    setErr("");
  };

  if (localStorage.getItem("token")) {
    return <Navigate to="/dashboard" replace />;
  }

  async function submit(e) {
    e.preventDefault();

    if (busy) return;

    setErr("");

    const name = f.name.trim();
    const email = f.email.trim().toLowerCase();

    if (register && name.length < 2) {
      setErr("Saisissez votre nom complet (au moins 2 caractères).");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Adresse e-mail invalide.");
      return;
    }

    if (f.password.length < 6) {
      setErr("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setBusy(true);

    try {
      const body = register
        ? { name, email, password: f.password }
        : { email, password: f.password };

      const response = await api(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          body,
        }
      );

      const data = response?.data || response;
      const token = data?.token || data?.accessToken;
      const user = data?.user || data?.currentUser;

      if (!token) {
        throw new Error(
          register
            ? "Inscription réussie, mais aucun token n'a été retourné par l'API."
            : "La réponse de connexion ne contient aucun token."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));

      nav("/dashboard", { replace: true });
    } catch (error) {
      setErr(error.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tf-card" style={{ maxWidth: 420, margin: "10vh auto" }}>
      <h3>{register ? "Créer un compte" : "Se connecter"}</h3>

      <p className="tf-sub">
        {register
          ? "Créez votre compte pour rejoindre TaskFlow."
          : "Accédez à votre espace TaskFlow."}
      </p>

      <form className="tf-form" onSubmit={submit} noValidate>
        {register && (
          <label>
            Nom complet
            <input
              type="text"
              value={f.name}
              onChange={set("name")}
              autoComplete="name"
              placeholder="Votre nom complet"
              required
              minLength={2}
              disabled={busy}
            />
          </label>
        )}

        <label>
          Adresse e-mail
          <input
            type="email"
            value={f.email}
            onChange={set("email")}
            autoComplete="email"
            placeholder="exemple@email.com"
            required
            disabled={busy}
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={f.password}
            onChange={set("password")}
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="6 caractères minimum"
            required
            minLength={6}
            disabled={busy}
          />
        </label>

        {err && (
          <div className="tf-err" role="alert">
            {err}
          </div>
        )}

        <button type="submit" disabled={busy}>
          {busy
            ? "Veuillez patienter…"
            : register
              ? "Créer mon compte"
              : "Me connecter"}
        </button>
      </form>

      <p className="tf-sub" style={{ textAlign: "center", marginBottom: 0 }}>
        {register ? (
          <>
            Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
          </>
        ) : (
          <>
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </>
        )}
      </p>
    </div>
  );
}
