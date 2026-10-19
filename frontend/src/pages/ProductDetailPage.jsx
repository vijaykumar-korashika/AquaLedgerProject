import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cartApi, catalogApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatMoney } from "../utils/money";
import { resolveMediaUrl } from "../utils/media";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    catalogApi
      .product(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    setError("");
    setMessage("");
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (user.role !== "customer") {
      setError("Only customer accounts can use the cart.");
      return;
    }
    try {
      await cartApi.addItem(product.id, quantity);
      setMessage("Added to cart.");
      toast("Added to cart.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="muted center-pad">Loading…</p>;
  if (error && !product) return <p className="alert alert-error">{error}</p>;
  if (!product) return null;

  const primary =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const image = resolveMediaUrl(primary?.url);
  const maxQty = product.stock_quantity || 1;

  return (
    <div className="product-detail">
      <Link to="/" className="back-link">← Back to shop</Link>
      <div className="product-detail-grid">
        <div className="product-detail-media panel">
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className="product-placeholder large" />
          )}
        </div>
        <div className="product-detail-info">
          <p className="product-category">{product.category_name}</p>
          <h1>{product.name}</h1>
          <p className="sku muted">SKU: {product.sku}</p>
          <p className="price-lg">{formatMoney(product.price)}</p>
          {product.in_stock ? (
            <p className="badge badge-ok inline">{product.stock_quantity} available</p>
          ) : (
            <p className="badge badge-muted inline">Out of stock</p>
          )}
          <p className="description">{product.description}</p>

          {product.in_stock && (
            <div className="add-row">
              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value) || 1)))
                  }
                />
              </label>
              <button type="button" className="btn btn-primary" onClick={addToCart}>
                Add to cart
              </button>
            </div>
          )}

          {message && <p className="alert alert-success">{message}</p>}
          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
