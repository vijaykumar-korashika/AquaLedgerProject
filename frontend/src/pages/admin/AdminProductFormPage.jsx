import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";
import { resolveMediaUrl } from "../../utils/media";

const empty = {
  category: "",
  name: "",
  sku: "",
  description: "",
  price: "",
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
};

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [images, setImages] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProduct = () => {
    if (isNew) return;
    setLoading(true);
    adminApi
      .product(id)
      .then((p) => {
        setForm({
          category: p.category,
          name: p.name,
          sku: p.sku,
          description: p.description,
          price: p.price,
          stock_quantity: p.stock_quantity,
          low_stock_threshold: p.low_stock_threshold,
          is_active: p.is_active,
        });
        setImages(p.images || []);
      })
      .catch((err) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    adminApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadProduct();
  }, [id, isNew]);

  const update = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const uploadFile = async (productId, file, asPrimary = false) => {
    setUploading(true);
    try {
      const image = await adminApi.uploadProductImage(
        productId,
        file,
        form.name,
        asPrimary
      );
      setImages((list) => [...list, image]);
      toast("Image uploaded.");
      return image;
    } catch (err) {
      toast(err.message, "error");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      category: Number(form.category),
      price: form.price,
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    };
    try {
      if (isNew) {
        const created = await adminApi.createProduct(payload);
        if (pendingFile) {
          await uploadFile(created.id, pendingFile, true);
          setPendingFile(null);
        }
        toast("Product created.");
        navigate(`/admin/products/${created.id}`);
      } else {
        await adminApi.updateProduct(id, payload);
        toast("Product saved.");
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isNew) {
      setPendingFile(file);
      toast("Image will upload when you save the product.");
      e.target.value = "";
      return;
    }
    try {
      await uploadFile(id, file, images.length === 0);
      loadProduct();
    } catch {
      /* toast shown in uploadFile */
    }
    e.target.value = "";
  };

  const onReplaceImage = async (imageId, e) => {
    const file = e.target.files?.[0];
    if (!file || isNew) return;
    setUploading(true);
    try {
      const updated = await adminApi.replaceProductImage(id, imageId, file);
      setImages((list) => list.map((img) => (img.id === imageId ? updated : img)));
      toast("Image replaced.");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onSetPrimary = async (imageId) => {
    try {
      const updated = await adminApi.updateProductImage(id, imageId, {
        is_primary: true,
      });
      setImages((list) =>
        list.map((img) => ({
          ...img,
          is_primary: img.id === updated.id,
        }))
      );
      toast("Primary image updated.");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const onDeleteImage = async (imageId) => {
    if (!window.confirm("Remove this image?")) return;
    try {
      await adminApi.deleteProductImage(id, imageId);
      setImages((list) => list.filter((img) => img.id !== imageId));
      toast("Image removed.");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  if (loading) return <p className="muted">Loading product…</p>;

  return (
    <div className="admin-form-page">
      <Link to="/admin/products" className="back-link">← Products</Link>
      <form className="panel admin-form" onSubmit={onSubmit}>
        <h2>{isNew ? "New product" : "Edit product"}</h2>
        <div className="form-grid">
          <label>
            Name
            <input required value={form.name} onChange={update("name")} />
          </label>
          <label>
            SKU
            <input required value={form.sku} onChange={update("sku")} />
          </label>
          <label>
            Category
            <select required value={form.category} onChange={update("category")}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Price
            <input required type="number" step="0.01" min="0.01" value={form.price} onChange={update("price")} />
          </label>
          <label>
            Stock quantity
            <input required type="number" min="0" value={form.stock_quantity} onChange={update("stock_quantity")} />
          </label>
          <label>
            Low stock threshold
            <input required type="number" min="0" value={form.low_stock_threshold} onChange={update("low_stock_threshold")} />
          </label>
        </div>
        <label>
          Description
          <textarea rows={4} value={form.description} onChange={update("description")} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.is_active} onChange={update("is_active")} />
          Visible in storefront
        </label>

        <div className="image-upload-block">
          <h3>Product images</h3>
          <p className="muted tiny">
            PNG, JPEG, or WebP up to 5 MB. Set a primary image for the shop catalog.
          </p>

          {pendingFile && isNew && (
            <p className="alert alert-success">
              Ready to upload: <strong>{pendingFile.name}</strong> (on save)
            </p>
          )}

          {!isNew && images.length > 0 && (
            <div className="image-edit-grid">
              {images.map((img) => (
                <div key={img.id} className="image-edit-card">
                  <img
                    src={resolveMediaUrl(img.url)}
                    alt={img.alt_text || form.name}
                  />
                  {img.is_primary && <span className="badge badge-ok">Primary</span>}
                  <div className="image-edit-actions">
                    {!img.is_primary && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onSetPrimary(img.id)}
                      >
                        Set primary
                      </button>
                    )}
                    <label className="btn btn-ghost btn-sm file-btn">
                      Replace
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        hidden
                        onChange={(e) => onReplaceImage(img.id, e)}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onDeleteImage(img.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="file-input">
            {uploading ? "Uploading…" : isNew ? "Choose image (uploads on save)" : "Add another image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading}
              onChange={onImageUpload}
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </form>
    </div>
  );
}
