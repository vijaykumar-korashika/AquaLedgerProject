import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orderApi } from "../../api";
import StatusBadge from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { formatMoney } from "../../utils/money";
import PrintButton from "../../components/PrintButton";
import { nextStatuses, statusLabel } from "../../utils/orderStatus";

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    orderApi
      .get(id)
      .then(setOrder)
      .catch((err) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (status) => {
    setUpdating(true);
    try {
      const updated = await orderApi.updateStatus(id, status);
      setOrder(updated);
      toast(`Order marked as ${statusLabel(status)}.`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="muted">Loading order…</p>;
  if (!order) return null;

  const allowed = nextStatuses(order.status);

  return (
    <div className="print-sheet">
      <div className="print-header print-only">
        <h1>AquaLedger360</h1>
        <p>Order invoice / packing slip</p>
      </div>
      <div className="no-print">
        <Link to="/admin/orders" className="back-link">← Orders</Link>
      </div>
      <header className="order-detail-header">
        <div>
          <h2>{order.number}</h2>
          <p className="muted">{order.customer_email}</p>
        </div>
        <div className="header-actions-row">
          <StatusBadge status={order.status} />
          <PrintButton label="Print invoice" />
        </div>
      </header>

      {allowed.length > 0 && (
        <section className="panel status-actions no-print">
          <h3>Update status</h3>
          <div className="status-action-row">
            {allowed.map((status) => (
              <button
                key={status}
                type="button"
                className="btn btn-ghost"
                disabled={updating}
                onClick={() => changeStatus(status)}
              >
                → {statusLabel(status)}
              </button>
            ))}
          </div>
          {order.status !== "cancelled" && allowed.includes("cancelled") && (
            <p className="muted tiny">Cancelling restores product stock automatically.</p>
          )}
        </section>
      )}

      <div className="admin-grid-2">
        <section className="panel">
          <h3>Line items</h3>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name} <span className="muted">({item.sku})</span></td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="summary-total">
            <strong>Total</strong>
            <span>{formatMoney(order.total)}</span>
          </p>
        </section>
        <section className="panel">
          <h3>Shipping</h3>
          <p>{order.shipping_name}</p>
          <p>{order.shipping_phone}</p>
          <p>{order.shipping_address}</p>
          <p>{order.shipping_city} {order.shipping_postal_code}</p>
          {order.notes && <p className="muted">Notes: {order.notes}</p>}
          <p className="muted tiny">Placed {new Date(order.created_at).toLocaleString()}</p>
        </section>
      </div>
    </div>
  );
}
