import { useState } from "react";
import { adminApi } from "../../api";
import { useToast } from "../../context/ToastContext";

const EXPORTS = [
  { key: "orders", label: "Orders (CSV)", run: (params) => adminApi.exportOrders(params) },
  { key: "products", label: "Products (CSV)", run: () => adminApi.exportProducts() },
  { key: "inventory", label: "Inventory alerts (CSV)", run: () => adminApi.exportInventory() },
  { key: "customers", label: "Customers (CSV)", run: () => adminApi.exportCustomers() },
];

export default function ExportMenu({ orderStatus = "" }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async (item) => {
    setBusy(true);
    try {
      const params = item.key === "orders" && orderStatus ? { status: orderStatus } : {};
      await item.run(params);
      toast(`${item.label} downloaded.`);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <div className="export-menu">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
      >
        {busy ? "Exporting…" : "Export CSV ▾"}
      </button>
      {open && (
        <div className="export-dropdown panel">
          {EXPORTS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="export-item"
              onClick={() => handleExport(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
