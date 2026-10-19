export default function PrintButton({ label = "Print" }) {
  return (
    <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
