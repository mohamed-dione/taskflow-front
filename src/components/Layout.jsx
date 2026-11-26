import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { API_DOCS } from "../api";

const MENU = [
  ["/dashboard", "Dashboard"],
  ["/projets", "Projets"],
  ["/taches", "Tâches"],
  ["/statistiques", "Statistiques"],
  ["/utilisateurs", "Utilisateurs"],
  ["/parametres", "Paramètres"],
];

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();

  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const isAdmin = user.role === "ADMIN";

  // Empêche un utilisateur standard d'accéder directement à cette page.
  if (pathname.startsWith("/utilisateurs") && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const initials = (user.name || "?")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentMenu = MENU.find(([path]) => path === pathname);
  const title = currentMenu?.[1] || "TaskFlow";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login", { replace: true });
  }

  return (
    <div className="tf-shell">
      <aside className="tf-side">
        <div className="tf-brand">
          TaskFlow
          <small>{isAdmin ? "Admin" : "Espace utilisateur"}</small>
        </div>

        <nav>
          {MENU.filter(
            ([path]) => path !== "/utilisateurs" || isAdmin
          ).map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `tf-link${isActive ? " active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}

          <a
            className="tf-link"
            href={API_DOCS}
            target="_blank"
            rel="noreferrer"
          >
            Documentation API
          </a>

          <button className="tf-link" onClick={logout} type="button">
            Déconnexion
          </button>
        </nav>
      </aside>

      <div className="tf-main">
        <header>
          <div>
            <h1>{title}</h1>
            <p>
              Bienvenue sur votre espace{" "}
              {isAdmin ? "d’administration" : "TaskFlow"}.
            </p>
          </div>

          <span
            className="tf-avatar"
            title={`${user.email || ""} · ${user.role || ""}`}
          >
            {initials}
          </span>
        </header>

        <main>
          <Outlet />
        </main>

        <footer>
          © 2026 TaskFlow Admin. Tous droits réservés.
        </footer>
      </div>
    </div>
  );
}
