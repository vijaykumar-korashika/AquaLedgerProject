import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ExportMenu from "./ExportMenu";

const NAV = [
  { to: "/admin", end: true, label: "Overview", icon: "◆" },
  { to: "/admin/products", label: "Products", icon: "▣" },
  { to: "/admin/categories", label: "Categories", icon: "▤" },
  { to: "/admin/orders", label: "Orders", icon: "◎" },
  { to: "/admin/customers", label: "Customers", icon: "◇" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark">AL</span>
          <div>
            <strong>Admin console</strong>
            <p className="muted tiny">AquaLedger360</p>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="admin-nav-link"
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/" className="admin-nav-link subtle">← View storefront</Link>
          <p className="muted tiny">{user?.email}</p>
          <button type="button" className="btn btn-ghost wide" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar admin-topbar-row">
          <div>
            <h1 className="admin-page-title">Owner dashboard</h1>
            <p className="muted tiny">Catalog, inventory, orders &amp; customers</p>
          </div>
          <ExportMenu />
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
