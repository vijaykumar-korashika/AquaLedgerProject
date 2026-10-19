import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { formatMoney } from "../../utils/money";
import { statusLabel } from "../../utils/orderStatus";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .reportSummary()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="skeleton-card" />
        <div className="skeleton-grid" />
      </div>
    );
  }
  if (error) return <p className="alert alert-error">{error}</p>;
  if (!data) return null;

  const statusEntries = Object.entries(data.orders_by_status || {});
  const maxStatus = Math.max(...statusEntries.map(([, c]) => c), 1);
  const customers = data.customers || {};
  const sales = data.sales || {};
  const trendPct = sales.revenue_trend_pct;
  const trendHint =
    trendPct == null
      ? "No prior period to compare"
      : `${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}% vs previous 30 days`;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-hero panel">
        <div>
          <h2>Business overview</h2>
          <p className="muted">
            Live snapshot of sales, inventory, and customer activity for AquaLedger360.
          </p>
        </div>
        <div className="quick-actions">
          <Link to="/admin/orders" className="btn btn-ghost btn-sm">Orders</Link>
          <Link to="/admin/products" className="btn btn-ghost btn-sm">Products</Link>
          <Link to="/admin/customers" className="btn btn-primary btn-sm">Customers</Link>
        </div>
      </header>

      <section className="stat-grid stat-grid-wide">
        <StatCard
          label="Total revenue"
          value={formatMoney(data.revenue)}
          hint="All non-cancelled orders"
          tone="accent"
        />
        <StatCard
          label="Revenue (30 days)"
          value={formatMoney(sales.revenue_30d ?? 0)}
          hint={trendHint}
        />
        <StatCard
          label="Units purchased"
          value={sales.units_sold ?? 0}
          hint={`${sales.units_sold_30d ?? 0} sold in last 30 days`}
        />
        <StatCard
          label="Stock on hand"
          value={data.products.total_stock_units ?? 0}
          hint={`Retail value ${formatMoney(data.products.inventory_retail_value ?? 0)}`}
        />
        <StatCard
          label="Orders"
          value={data.orders?.paid_count ?? 0}
          hint={`${data.orders?.pending ?? 0} pending approval`}
        />
        <StatCard
          label="Avg. order value"
          value={formatMoney(data.orders?.average_value ?? 0)}
          hint="Paid orders only"
        />
        <StatCard
          label="Customers"
          value={customers.total ?? 0}
          hint={`${customers.new_30d ?? 0} joined in 30 days`}
        />
        <StatCard
          label="Active catalog"
          value={data.products.active}
          hint={`${data.products.out_of_stock} out of stock`}
        />
        <StatCard
          label="Stock alerts"
          value={data.products.low_stock.length}
          hint="At or below threshold"
          tone="warn"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Trending products</h2>
          <Link to="/admin/products">Full catalog</Link>
        </div>
        {(data.trending_products || []).length === 0 ? (
          <p className="muted">No sales yet — units purchased will appear here.</p>
        ) : (
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Units sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.trending_products.map((row) => (
                <tr key={row.product_id}>
                  <td>
                    <Link to={`/admin/products/${row.product_id}`}>{row.product_name}</Link>
                  </td>
                  <td>{row.sku}</td>
                  <td>{row.units_sold}</td>
                  <td>{formatMoney(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="admin-grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Customer insights</h2>
            <Link to="/admin/customers">Manage customers</Link>
          </div>
          <p className="muted tiny">
            {customers.with_orders ?? 0} customers have placed at least one paid order.
          </p>
          <h3 className="subsection-title">Top by spend</h3>
          {(customers.top || []).length === 0 ? (
            <p className="muted">No customer orders yet.</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.top.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/admin/customers/${row.id}`}>
                        {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}
                      </Link>
                    </td>
                    <td>{row.order_count}</td>
                    <td>{formatMoney(row.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h3 className="subsection-title">Recent sign-ups</h3>
          <ul className="insight-list">
            {(customers.recent || []).map((row) => (
              <li key={row.id}>
                <Link to={`/admin/customers/${row.id}`}>{row.email}</Link>
                <span className="muted">{formatDate(row.date_joined)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Orders by status</h2>
            <Link to="/admin/orders">View queue</Link>
          </div>
          <div className="status-bars">
            {statusEntries.length === 0 ? (
              <p className="muted">No orders yet.</p>
            ) : (
              statusEntries.map(([status, count]) => (
                <div key={status} className="status-bar-row">
                  <span className="status-bar-label">{statusLabel(status)}</span>
                  <div className="status-bar-track">
                    <div
                      className={`status-bar-fill status-${status}`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="status-bar-count">{count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="admin-grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Low stock</h2>
            <Link to="/admin/products">Inventory</Link>
          </div>
          {data.products.low_stock.length === 0 ? (
            <p className="muted">All products above threshold.</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.products.low_stock.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.sku}</td>
                    <td>
                      <span className={row.stock_quantity === 0 ? "text-danger" : "text-warn"}>
                        {row.stock_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders">All orders</Link>
          </div>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent_orders || []).slice(0, 6).map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/admin/orders/${order.id}`}>{order.number}</Link>
                  </td>
                  <td>{order.customer_email}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
