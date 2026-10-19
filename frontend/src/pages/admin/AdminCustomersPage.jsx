import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api";
import ExportMenu from "../../components/admin/ExportMenu";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatMoney } from "../../utils/money";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const SORT_OPTIONS = [
  { value: "-date_joined", label: "Newest first" },
  { value: "date_joined", label: "Oldest first" },
  { value: "-total_spent", label: "Highest spend" },
  { value: "-order_count", label: "Most orders" },
  { value: "email", label: "Email A–Z" },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-date_joined");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    adminApi.customerStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    adminApi
      .customers({
        page,
        search: debouncedSearch || undefined,
        ordering,
      })
      .then((data) => {
        setCustomers(data.results || []);
        setCount(data.count || 0);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, ordering]);

  const totalPages = Math.max(1, Math.ceil(count / 12));

  return (
    <div className="customers-admin">
      <header className="dashboard-hero panel">
        <div>
          <h2>Customer directory</h2>
          <p className="muted">
            Search, sort, and review lifetime value and order history per shopper.
          </p>
        </div>
        <ExportMenu />
      </header>

      {stats && (
        <section className="stat-grid">
          <article className="stat-card">
            <p className="stat-label">Total customers</p>
            <p className="stat-value">{stats.total_customers}</p>
          </article>
          <article className="stat-card">
            <p className="stat-label">With orders</p>
            <p className="stat-value">{stats.customers_with_orders}</p>
          </article>
          <article className="stat-card stat-accent">
            <p className="stat-label">New (30 days)</p>
            <p className="stat-value">{stats.new_customers_30d}</p>
          </article>
        </section>
      )}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search email, name, phone, city…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={ordering}
          onChange={(e) => {
            setOrdering(e.target.value);
            setPage(1);
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <p className="muted">Loading customers…</p>
        ) : customers.length === 0 ? (
          <p className="muted">No customers match your search.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Lifetime value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</strong>
                    <div className="muted tiny">{c.email}</div>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{[c.city, c.postal_code].filter(Boolean).join(" ") || "—"}</td>
                  <td>{formatDate(c.date_joined)}</td>
                  <td>{c.order_count ?? 0}</td>
                  <td>{formatMoney(c.total_spent ?? 0)}</td>
                  <td>
                    <Link to={`/admin/customers/${c.id}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="muted tiny table-foot">
        Showing {customers.length} of {count} customers
      </p>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
