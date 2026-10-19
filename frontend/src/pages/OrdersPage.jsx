import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../api";
import { formatMoney } from "../utils/money";

function statusLabel(status) {
  return status.replace(/_/g, " ");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    orderApi
      .list()
      .then((data) => setOrders(data.results || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted center-pad">Loading orders…</p>;

  return (
    <div className="orders-page">
      <h1>My orders</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {orders.length === 0 ? (
        <div className="panel empty-state">
          <p>You have not placed any orders yet.</p>
          <Link to="/" className="btn btn-primary">Start shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="panel order-row">
              <div>
                <strong>{order.number}</strong>
                <p className="muted">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="order-row-meta">
                <span className={`badge status-${order.status}`}>
                  {statusLabel(order.status)}
                </span>
                <span className="price">{formatMoney(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
