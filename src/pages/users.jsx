import { useState } from "react";
import { useList, id, PER } from "../api";
import Pager from "../Pager";

export default function Users() {
  const u = useList("/api/users");
  const [page, setPage] = useState(1);
  return (
    <div className="tf-card">
      <h3>Utilisateurs</h3>
      <p className="tf-sub">{u.items.length} utilisateur(s)</p>
      {u.err && <div className="tf-err" role="alert">{u.err}</div>}
      {u.loading ? <p>Chargement…</p> : u.items.length === 0 ? <p>Aucun utilisateur à afficher.</p> : (
        <div className="tf-wrap"><table className="tf-table">
          <thead><tr><th>Nom</th><th>Adresse e-mail</th><th>Rôle</th></tr></thead>
          <tbody>{u.items.slice((page - 1) * PER, page * PER).map((x) => <tr key={id(x)}><td>{x.name}</td><td>{x.email}</td><td>{x.role}</td></tr>)}</tbody>
        </table></div>
      )}
      <Pager page={page} total={u.items.length} onChange={setPage} />
    </div>
  );
}