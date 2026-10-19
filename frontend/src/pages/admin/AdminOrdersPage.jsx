import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import { ORDER_STATUSES } from "../../utils/orderStatus";
import ExportMenu from "../../components/admin/ExportMenu";
import { formatMoney } from "../../utils/money";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderApi
      .list({
        page,
        status: status || undefined,
        search: search || undefined,
        ordering: "-created_at",
      })
      .then((data) => {
        setOrders(data.results || []);
        setCount(data.count || 0);
      })
      .finally(() => setLoading(false));
  }, [page, status, search]);

  const totalPages = Math.max(1, Math.ceil(count / 12));

  return (
    <div>
      <div className="admin-toolbar">
        <ExportMenu orderStatus={status} />
        <input
          type="search"
          placeholder="Order # or name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <p className="muted">Loading orders…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.number}</td>
                  <td>{order.customer_email}</td>
                  <td className="muted">{new Date(order.created_at).toLocaleString()}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{formatMoney(order.total)}</td>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} className="btn btn-ghost btn-sm">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
