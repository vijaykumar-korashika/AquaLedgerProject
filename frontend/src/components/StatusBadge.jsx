import { statusLabel } from "../utils/orderStatus";

export default function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status}`}>{statusLabel(status)}</span>
  );
}
