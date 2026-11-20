const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return body as T;
}

export const api = {
  previewSplit: (payload: unknown) => request<any>('/splits/preview', { method: 'POST', body: JSON.stringify(payload) }),
  createGroup: (payload: unknown) => request<any>('/groups', { method: 'POST', body: JSON.stringify(payload) }),
  listGroups: () => request<any[]>('/groups'),
};
