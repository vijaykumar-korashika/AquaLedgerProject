import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartApi, orderApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../utils/money";

export default function CheckoutPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_postal_code: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refreshProfile().catch(() => {});
    cartApi.get().then(setCart).catch(() => {});
  }, [refreshProfile]);

  useEffect(() => {
    if (!user) return;
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setForm((f) => ({
      ...f,
      shipping_name: f.shipping_name || name,
      shipping_phone: f.shipping_phone || user.phone || "",
      shipping_address: f.shipping_address || user.address || "",
      shipping_city: f.shipping_city || user.city || "",
      shipping_postal_code: f.shipping_postal_code || user.postal_code || "",
    }));
  }, [user]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const order = await orderApi.checkout(form);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="panel empty-state">
        <p>Add items to your cart before checkout.</p>
        <Link to="/" className="btn btn-primary">Shop products</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form className="panel" onSubmit={onSubmit}>
          <h2>Shipping details</h2>
          <label>
            Full name
            <input required value={form.shipping_name} onChange={update("shipping_name")} />
          </label>
          <label>
            Phone
            <input required value={form.shipping_phone} onChange={update("shipping_phone")} />
          </label>
          <label>
            Address
            <textarea required rows={3} value={form.shipping_address} onChange={update("shipping_address")} />
          </label>
          <label>
            City
            <input required value={form.shipping_city} onChange={update("shipping_city")} />
          </label>
          <label>
            Postal code
            <input value={form.shipping_postal_code} onChange={update("shipping_postal_code")} />
          </label>
          <label>
            Order notes
            <textarea rows={2} value={form.notes} onChange={update("notes")} />
          </label>
          {error && <p className="alert alert-error">{error}</p>}
          <button type="submit" className="btn btn-primary wide" disabled={submitting}>
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </form>
        <aside className="panel checkout-summary">
          <h2>Order summary</h2>
          <ul className="summary-list">
            {cart.items.map((item) => (
              <li key={item.id}>
                <span>{item.product_name} × {item.quantity}</span>
                <span>{formatMoney(item.line_total)}</span>
              </li>
            ))}
          </ul>
          <p className="summary-total">
            <strong>Total</strong>
            <span>{formatMoney(cart.subtotal)}</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
