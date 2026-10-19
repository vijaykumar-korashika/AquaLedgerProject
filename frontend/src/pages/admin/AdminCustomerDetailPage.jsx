import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../utils/money";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .customer(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Loading customer…</p>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!data?.customer) return null;

  const c = data.customer;

  return (
    <div>
      <Link to="/admin/customers" className="back-link">← Customers</Link>

      <header className="dashboard-hero panel customer-detail-head">
        <div>
          <h2>{[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email}</h2>
          <p className="muted">{c.email}</p>
        </div>
        <div className="customer-kpis">
          <div>
            <span className="stat-label">Orders</span>
            <strong>{c.order_count ?? 0}</strong>
          </div>
          <div>
            <span className="stat-label">Lifetime value</span>
            <strong>{formatMoney(c.total_spent ?? 0)}</strong>
          </div>
          <div>
            <span className="stat-label">Member since</span>
            <strong>{formatDateTime(c.date_joined)}</strong>
          </div>
        </div>
      </header>

      <div className="admin-grid-2">
        <section className="panel">
          <h3>Contact &amp; shipping profile</h3>
          <dl className="detail-dl">
            <dt>Phone</dt>
            <dd>{c.phone || "—"}</dd>
            <dt>Address</dt>
            <dd>{c.address || "—"}</dd>
            <dt>City</dt>
            <dd>{c.city || "—"}</dd>
            <dt>Postal code</dt>
            <dd>{c.postal_code || "—"}</dd>
          </dl>
        </section>

        <section className="panel">
          <h3>Recent orders</h3>
          {(data.recent_orders || []).length === 0 ? (
            <p className="muted">This customer has not placed any orders yet.</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/orders/${order.id}`}>{order.number}</Link>
                    </td>
                    <td className="muted">{formatDateTime(order.created_at)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>{formatMoney(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
