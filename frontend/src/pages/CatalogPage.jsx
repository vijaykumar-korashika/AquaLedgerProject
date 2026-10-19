import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { catalogApi } from "../api";

const ORDERING_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "-name", label: "Name (Z–A)" },
  { value: "price", label: "Price (low to high)" },
  { value: "-price", label: "Price (high to low)" },
];

export default function CatalogPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [inStock, setInStock] = useState(false);
  const [ordering, setOrdering] = useState("name");

  useEffect(() => {
    catalogApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    catalogApi
      .products({
        page,
        search: search || undefined,
        category_slug: categorySlug || undefined,
        in_stock: inStock ? "true" : undefined,
        ordering,
      })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.results || []);
        setCount(data.count || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search, categorySlug, inStock, ordering]);

  const totalPages = Math.max(1, Math.ceil(count / 12));

  const onFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="catalog-page">
      <section className="hero">
        <h1>AquaLedger live catalog</h1>
        <p className="lead">
          Fish, aquatic plants, medicines, and liquid care — everything for your tank.
        </p>
        <div className="category-pills">
          <button
            type="button"
            className={`pill ${categorySlug === "" ? "active" : ""}`}
            onClick={() => {
              setCategorySlug("");
              setPage(1);
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`pill ${categorySlug === cat.slug ? "active" : ""}`}
              onClick={() => {
                setCategorySlug(cat.slug);
                setPage(1);
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <form className="filters panel" onSubmit={onFilterSubmit}>
        <label>
          Search
          <input
            type="search"
            placeholder="Name, SKU, description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Category
          <select
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={ordering}
            onChange={(e) => {
              setOrdering(e.target.value);
              setPage(1);
            }}
          >
            {ORDERING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => {
              setInStock(e.target.checked);
              setPage(1);
            }}
          />
          In stock only
        </label>
      </form>

      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="muted center-pad">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="muted center-pad">No products match your filters.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

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
