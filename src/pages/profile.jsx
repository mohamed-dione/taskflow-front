
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtDate } from "../api";

export default function Parametres() {
  const nav = useNavigate();

  const [f, setF] = useState({
    name: "",
    email: "",
  });

  const [info, setInfo] = useState({
    role: "",
    createdAt: "",
  });

  const [msg, setMsg] = useState({
    type: "",
    text: "",
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const r = await api("/api/users/me");
        const u = r?.data || r?.user || r;

        if (cancelled) return;

        setF({
          name: u.name || "",
          email: u.email || "",
        });

        setInfo({
          role: u.role || "",
          createdAt: u.createdAt || "",
        });
      } catch (error) {
        if (!cancelled) {
          setMsg({
            type: "err",
            text: error.message || "Impossible de charger le profil.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field, value) {
    setF((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    const name = f.name.trim();
    const email = f.email.trim();

    if (name.length < 2) {
      setMsg({
        type: "err",
        text: "Le nom est obligatoire (2 caractères minimum).",
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg({
        type: "err",
        text: "Adresse e-mail invalide.",
      });
      return;
    }

    setBusy(true);

    try {
      const r = await api("/api/users/me", {
        method: "PATCH",
        body: { name, email },
      });

      const u = r?.data || r?.user || r;

      let currentUser = {};

      try {
        currentUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
      } catch {
        currentUser = {};
      }

      const updatedUser = {
        ...currentUser,
        name: u?.name || name,
        email: u?.email || email,
        role: u?.role || info.role,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setF({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      setInfo((current) => ({
        ...current,
        role: updatedUser.role,
        createdAt: u?.createdAt || current.createdAt,
      }));

      setMsg({
        type: "ok",
        text: "Profil mis à jour avec succès.",
      });
    } catch (error) {
      setMsg({
        type: "err",
        text: error.message || "La mise à jour du profil a échoué.",
      });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="tf-card">
        <p>Chargement du profil…</p>
      </div>
    );
  }

  return (
    <div className="tf-card">
      <h3>Mon profil</h3>

      <p className="tf-sub">
        Rôle : {info.role || "—"} · Inscrit le{" "}
        {info.createdAt ? fmtDate(info.createdAt) : "—"}
      </p>

      <form
        className="tf-form"
        onSubmit={save}
        noValidate
      >
        <label>
          Nom complet
          <input
            type="text"
            value={f.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Votre nom complet"
            autoComplete="name"
            disabled={busy}
          />
        </label>

        <label>
          Adresse e-mail
          <input
            type="email"
            value={f.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="exemple@email.com"
            autoComplete="email"
            disabled={busy}
          />
        </label>

        {msg.text && (
          <div
            className={msg.type === "ok" ? "tf-ok" : "tf-err"}
            role="status"
          >
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>

        <button
          type="button"
          className="tf-ghost"
          onClick={logout}
          disabled={busy}
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
