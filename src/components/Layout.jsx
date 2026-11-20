import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

const MENU = [["/dashboard", "Dashboard"], ["/projets", "Projets"], ["/taches", "Tâches"], ["/statistiques", "Statistiques"], ["/utilisateurs", "Utilisateurs"], ["/parametres", "Paramètres"]];

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  if (!localStorage.getItem("token")) return <Navigate to="/login" replace />;
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (u.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const title = (MENU.find(([p]) => p === pathname) || ["", ""])[1];
  const logout = () => { localStorage.clear(); nav("/login"); };

  return (
    <div className="tf-shell">
      <aside className="tf-side">
        <div className="tf-brand">TaskFlow<small>Admin</small></div>
        <nav>
          {MENU.filter(([p]) => p !== "/utilisateurs" || u.role === "ADMIN").map(([to, l]) => <NavLink key={to} to={to} className="tf-link">{l}</NavLink>)}
          <a className="tf-link" href={`${import.meta.env.VITE_API_URL}/api-docs`} target="_blank" rel="noreferrer">Documentation API</a>
          <button className="tf-link" onClick={logout}>Déconnexion</button>
        </nav>
      </aside>
      <div className="tf-main">
        <header>
          <div><h1>{title}</h1><p>Bienvenue sur votre espace d’administration.</p></div>
          <span className="tf-avatar" title={`${u.email || ""} · ${u.role || ""}`}>{initials}</span>
        </header>
        <main><Outlet /></main>
        <footer>© 2026 TaskFlow Admin. Tous droits réservés.</footer>
      </div>
    </div>
  );
}
