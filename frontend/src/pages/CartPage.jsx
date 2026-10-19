import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cartApi } from "../api";
import { formatMoney } from "../utils/money";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    cartApi
      .get()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateQty = async (itemId, quantity) => {
    try {
      const data = await cartApi.updateItem(itemId, quantity);
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (itemId) => {
    try {
      const data = await cartApi.removeItem(itemId);
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="muted center-pad">Loading cart…</p>;

  const items = cart?.items || [];

  return (
    <div className="cart-page">
      <h1>Your cart</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {items.length === 0 ? (
        <div className="panel empty-state">
          <p>Your cart is empty.</p>
          <Link to="/" className="btn btn-primary">Continue shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-table panel">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/products/${item.product}`}>{item.product_name}</Link>
                    </td>
                    <td>{formatMoney(item.unit_price)}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          if (q >= 1) updateQty(item.id, q);
                        }}
                      />
                    </td>
                    <td>{formatMoney(item.line_total)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => remove(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-summary panel">
            <p>
              <strong>Subtotal:</strong> {formatMoney(cart.subtotal)}
            </p>
            <Link to="/checkout" className="btn btn-primary">
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
