export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const STATUS_TRANSITIONS = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function statusLabel(status) {
  return status.replace(/_/g, " ");
}

export function nextStatuses(current) {
  return STATUS_TRANSITIONS[current] || [];
}
