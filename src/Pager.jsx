import { PER } from "./api";

export default function Pager({ page, total = 0, pages, onChange }) {
  const n = pages ?? Math.max(1, Math.ceil(total / PER));
  return (
    <div className="tf-pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</button>
      <span>Page {page} sur {n}</span>
      <button disabled={page >= n} onClick={() => onChange(page + 1)}>Suivant</button>
    </div>
  );
}
