import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderApi } from "../api";
import PrintButton from "../components/PrintButton";
import StatusBadge from "../components/StatusBadge";
import { formatMoney } from "../utils/money";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .get(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted center-pad">Loading order…</p>;
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!order) return null;

  return (
    <div className="order-detail print-sheet">
      <div className="print-header print-only">
        <h1>AquaLedger360</h1>
        <p>Order receipt</p>
      </div>
      <Link to="/orders" className="back-link no-print">← All orders</Link>
      <header className="order-detail-header">
        <div>
          <h1>{order.number}</h1>
          <p className="muted">Placed {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="header-actions-row">
          <StatusBadge status={order.status} />
          <PrintButton label="Print receipt" />
        </div>
      </header>

      <div className="order-detail-grid">
        <section className="panel">
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_price)}</td>
                  <td>{formatMoney(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="summary-total">
            <strong>Order total</strong>
            <span>{formatMoney(order.total)}</span>
          </p>
        </section>
        <section className="panel">
          <h2>Shipping</h2>
          <p>{order.shipping_name}</p>
          <p>{order.shipping_phone}</p>
          <p>{order.shipping_address}</p>
          <p>{order.shipping_city} {order.shipping_postal_code}</p>
          {order.notes && <p className="muted">Notes: {order.notes}</p>}
        </section>
      </div>
    </div>
  );
}
