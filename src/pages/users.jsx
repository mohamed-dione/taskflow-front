
import { useEffect, useMemo, useState } from "react";
import { useList, id, PER } from "../api";
import Pager from "../Pager";

export default function Users() {
  const u = useList("/api/users");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const users = Array.isArray(u.items) ? u.items : [];

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const name = String(user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const role = String(user.role || "").toUpperCase();

      const matchesSearch =
        !query || name.includes(query) || email.includes(query);

      const matchesRole =
        roleFilter === "ALL" || role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER));

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleUsers = filteredUsers.slice(
    (page - 1) * PER,
    page * PER
  );

  return (
    <div className="tf-card">
      <h3>Gestion des utilisateurs</h3>

      <p className="tf-sub">
        {filteredUsers.length} utilisateur(s) affiché(s) sur {users.length}
      </p>

      {u.err && (
        <div className="tf-err" role="alert">
          {u.err}
        </div>
      )}

      <div className="tf-row">
        <input
          type="search"
          className="tf-input"
          placeholder="Rechercher par nom ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un utilisateur"
        />

        <select
          className="tf-input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filtrer par rôle"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="ADMIN">Administrateurs</option>
          <option value="USER">Utilisateurs</option>
        </select>
      </div>

      {u.loading ? (
        <p>Chargement des utilisateurs…</p>
      ) : visibleUsers.length === 0 ? (
        <p>
          {users.length === 0
            ? "Aucun utilisateur à afficher."
            : "Aucun utilisateur ne correspond à votre recherche."}
        </p>
      ) : (
        <div className="tf-wrap">
          <table className="tf-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse e-mail</th>
                <th>Rôle</th>
              </tr>
            </thead>

            <tbody>
              {visibleUsers.map((user, index) => {
                const userId = id(user) || user.email || `user-${index}`;
                const role = String(user.role || "USER").toUpperCase();

                return (
                  <tr key={userId}>
                    <td>{user.name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>
                      <span className="tf-badge">
                        {role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!u.loading && filteredUsers.length > PER && (
        <Pager
          page={page}
          total={filteredUsers.length}
          onChange={setPage}
        />
      )}
    </div>
  );
}
