import { useEffect, useState } from "react";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    adminApi
      .categories()
      .then(setCategories)
      .catch((err) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, form);
        toast("Category updated.");
      } else {
        await adminApi.createCategory({ ...form, is_active: true });
        toast("Category created.");
      }
      resetForm();
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description });
  };

  const toggleActive = async (cat) => {
    try {
      await adminApi.updateCategory(cat.id, { is_active: !cat.is_active });
      toast(cat.is_active ? "Category hidden." : "Category activated.");
      load();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  return (
    <div className="admin-grid-2">
      <form className="panel admin-form" onSubmit={onSubmit}>
        <h2>{editingId ? "Edit category" : "Add category"}</h2>
        <label>
          Name
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          Description
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="panel table-panel">
        <h2>All categories</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td className="muted">{cat.slug}</td>
                  <td>
                    {cat.is_active ? (
                      <span className="badge badge-ok">Active</span>
                    ) : (
                      <span className="badge badge-muted">Hidden</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(cat)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(cat)}>
                      {cat.is_active ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
