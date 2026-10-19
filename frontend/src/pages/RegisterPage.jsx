import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="panel auth-form" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <div className="form-row">
          <label>
            First name
            <input required value={form.first_name} onChange={update("first_name")} />
          </label>
          <label>
            Last name
            <input required value={form.last_name} onChange={update("last_name")} />
          </label>
        </div>
        <label>
          Email
          <input type="email" required value={form.email} onChange={update("email")} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
          />
        </label>
        <label>
          Phone
          <input value={form.phone} onChange={update("phone")} />
        </label>
        <label>
          City
          <input value={form.city} onChange={update("city")} />
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button type="submit" className="btn btn-primary wide" disabled={submitting}>
          {submitting ? "Creating…" : "Register"}
        </button>
        <p className="muted center">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
