import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { formatMoney } from "../../utils/money";
import { resolveMediaUrl } from "../../utils/media";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi
      .products({ page, search: search || undefined, ordering: "name" })
      .then((data) => {
        setProducts(data.results || []);
        setCount(data.count || 0);
      })
      .catch((err) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(count / 12));

  const toggleActive = async (product) => {
    try {
      await adminApi.updateProduct(product.id, { is_active: !product.is_active });
      toast(product.is_active ? "Product deactivated." : "Product activated.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search name, SKU…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Link to="/admin/products/new" className="btn btn-primary">
          + New product
        </Link>
      </div>

      <div className="panel table-panel">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumbImg =
                  p.images?.find((img) => img.is_primary) || p.images?.[0];
                const thumb = resolveMediaUrl(thumbImg?.url);
                return (
                <tr key={p.id}>
                  <td>
                    {thumb ? (
                      <img src={thumb} alt="" className="product-thumb" />
                    ) : (
                      <div className="product-thumb-placeholder" aria-hidden="true" />
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>{p.category_name}</td>
                  <td>{formatMoney(p.price)}</td>
                  <td>
                    <span
                      className={
                        p.stock_quantity === 0
                          ? "text-danger"
                          : p.stock_quantity <= p.low_stock_threshold
                            ? "text-warn"
                            : ""
                      }
                    >
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td>
                    {p.is_active ? (
                      <span className="badge badge-ok">Active</span>
                    ) : (
                      <span className="badge badge-muted">Hidden</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <Link to={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleActive(p)}
                    >
                      {p.is_active ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
