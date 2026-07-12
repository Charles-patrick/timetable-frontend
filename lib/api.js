const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Thin wrapper around fetch that always points at the backend, always
// sends the httpOnly auth cookie, and always parses/normalizes the
// {success, message, data, errors} response shape from the API.
async function request(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include", // sends the httpOnly JWT cookie cross-origin
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Non-JSON responses (e.g. PDF/Excel downloads) are handled by the caller
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) throw new Error("Request failed");
    return res;
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    const error = new Error(json.message || "Request failed");
    error.status = res.status;
    error.errors = json.errors || [];
    throw error;
  }

  return json.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { API_URL };
