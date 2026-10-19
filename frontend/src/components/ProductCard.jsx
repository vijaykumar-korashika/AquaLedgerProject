import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../utils/media";

function formatMoney(value) {
  const n = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ProductCard({ product }) {
  const primary =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const image = resolveMediaUrl(primary?.url);

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-media">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-placeholder" aria-hidden="true" />
        )}
      </Link>
      <div className="product-card-body">
        <p className="product-category">{product.category_name}</p>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="product-card-meta">
          <span className="price">{formatMoney(product.price)}</span>
          {product.in_stock ? (
            <span className="badge badge-ok">In stock</span>
          ) : (
            <span className="badge badge-muted">Out of stock</span>
          )}
        </div>
      </div>
    </article>
  );
}
