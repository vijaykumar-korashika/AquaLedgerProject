import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCartCount } from "../hooks/useCartCount";

export default function Layout() {
  const { user, logout } = useAuth();
  const cartCount = useCartCount();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">AL</span>
            <span>
              AquaLedger<span className="brand-accent">360</span>
            </span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end>Shop</NavLink>
            {user?.role === "customer" && (
              <>
                <NavLink to="/cart" className="cart-link">
                  Cart
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </NavLink>
                <NavLink to="/orders">My orders</NavLink>
              </>
            )}
            {user?.role === "owner" && (
              <NavLink to="/admin">Admin console</NavLink>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <div className="user-chip">
                <span>{user.first_name || user.email}</span>
                <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Sign in</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="site-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>AquaLedger360 — product &amp; inventory for aquatic retail.</p>
        </div>
      </footer>
    </div>
  );
}
