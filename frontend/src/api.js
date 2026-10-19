const TOKEN_KEY = "aqualedger.tokens";

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveTokens(tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }
  return { response, data };
}

export async function api(path, options = {}) {
  const tokens = getTokens();
  let { response, data } = await request(path, {
    ...options,
    token: tokens?.access,
  });

  if (
    response.status === 401 &&
    tokens?.refresh &&
    !options._retry &&
    path !== "/api/auth/token/refresh/"
  ) {
    const refreshed = await request("/api/auth/token/refresh/", {
      method: "POST",
      body: { refresh: tokens.refresh },
    });
    if (!refreshed.response.ok) {
      clearTokens();
      throw new Error("Session expired. Please sign in again.");
    }
    const next = {
      access: refreshed.data.access,
      refresh: refreshed.data.refresh || tokens.refresh,
    };
    saveTokens(next);
    return api(path, { ...options, _retry: true });
  }

  if (!response.ok) {
    const detail = data?.detail;
    let message = "Request failed.";
    if (typeof detail === "string") message = detail;
    else if (data && typeof data === "object") {
      const first = Object.values(data).flat()[0];
      if (typeof first === "string") message = first;
    }
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function downloadRequest(path, filename, options = {}) {
  const tokens = getTokens();
  const headers = {};
  if (tokens?.access) headers.Authorization = `Bearer ${tokens.access}`;

  let response = await fetch(path, { headers, ...options });

  if (
    response.status === 401 &&
    tokens?.refresh &&
    !options._retry
  ) {
    const refreshed = await request("/api/auth/token/refresh/", {
      method: "POST",
      body: { refresh: tokens.refresh },
    });
    if (!refreshed.response.ok) {
      clearTokens();
      throw new Error("Session expired. Please sign in again.");
    }
    saveTokens({
      access: refreshed.data.access,
      refresh: refreshed.data.refresh || tokens.refresh,
    });
    return downloadRequest(path, filename, { ...options, _retry: true });
  }

  if (!response.ok) {
    throw new Error("Export failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const authApi = {
  login: (email, password) =>
    api("/api/auth/token/", { method: "POST", body: { email, password } }),
  register: (payload) =>
    api("/api/auth/register/", { method: "POST", body: payload }),
  me: () => api("/api/auth/me/"),
};

export const catalogApi = {
  categories: () => api("/api/categories/"),
  products: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
    const query = qs.toString();
    return api(`/api/products/${query ? `?${query}` : ""}`);
  },
  product: (id) => api(`/api/products/${id}/`),
};

export const cartApi = {
  get: () => api("/api/cart/"),
  addItem: (productId, quantity = 1) =>
    api("/api/cart/items/", {
      method: "POST",
      body: { product_id: productId, quantity },
    }),
  updateItem: (itemId, quantity) =>
    api(`/api/cart/items/${itemId}/`, {
      method: "PATCH",
      body: { quantity },
    }),
  removeItem: (itemId) =>
    api(`/api/cart/items/${itemId}/`, { method: "DELETE" }),
};

export const orderApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
    const query = qs.toString();
    return api(`/api/orders/${query ? `?${query}` : ""}`);
  },
  get: (id) => api(`/api/orders/${id}/`),
  checkout: (payload) => api("/api/orders/", { method: "POST", body: payload }),
  updateStatus: (id, status) =>
    api(`/api/orders/${id}/status/`, { method: "PATCH", body: { status } }),
};

export const adminApi = {
  reportSummary: () => api("/api/reports/summary/"),
  customers: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
    const query = qs.toString();
    return api(`/api/customers/${query ? `?${query}` : ""}`);
  },
  customerStats: () => api("/api/customers/stats/"),
  customer: (id) => api(`/api/customers/${id}/`),
  categories: () => api("/api/categories/"),
  createCategory: (body) =>
    api("/api/categories/", { method: "POST", body }),
  updateCategory: (id, body) =>
    api(`/api/categories/${id}/`, { method: "PATCH", body }),
  deleteCategory: (id) =>
    api(`/api/categories/${id}/`, { method: "DELETE" }),
  products: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value));
      }
    });
    const query = qs.toString();
    return api(`/api/products/${query ? `?${query}` : ""}`);
  },
  product: (id) => api(`/api/products/${id}/`),
  createProduct: (body) => api("/api/products/", { method: "POST", body }),
  updateProduct: (id, body) =>
    api(`/api/products/${id}/`, { method: "PATCH", body }),
  deleteProduct: (id) => api(`/api/products/${id}/`, { method: "DELETE" }),
  uploadProductImage: (id, file, altText, isPrimary = false) => {
    const form = new FormData();
    form.append("image", file);
    if (altText) form.append("alt_text", altText);
    if (isPrimary) form.append("is_primary", "true");
    return api(`/api/products/${id}/images/`, {
      method: "POST",
      body: form,
      form: true,
    });
  },
  updateProductImage: (productId, imageId, body) =>
    api(`/api/products/${productId}/images/${imageId}/`, {
      method: "PATCH",
      body,
    }),
  replaceProductImage: (productId, imageId, file) => {
    const form = new FormData();
    form.append("image", file);
    return api(`/api/products/${productId}/images/${imageId}/`, {
      method: "PATCH",
      body: form,
      form: true,
    });
  },
  deleteProductImage: (productId, imageId) =>
    api(`/api/products/${productId}/images/${imageId}/`, {
      method: "DELETE",
    }),
  exportOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const path = qs
      ? `/api/reports/export/orders/?${qs}`
      : "/api/reports/export/orders/";
    return downloadRequest(path, "aqualedger360-orders.csv");
  },
  exportProducts: () =>
    downloadRequest("/api/reports/export/products/", "aqualedger360-products.csv"),
  exportInventory: () =>
    downloadRequest("/api/reports/export/inventory/", "aqualedger360-inventory.csv"),
  exportCustomers: () =>
    downloadRequest("/api/reports/export/customers/", "aqualedger360-customers.csv"),
};
