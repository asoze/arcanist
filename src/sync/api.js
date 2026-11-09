const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, { status = null, offline = false } = {}) {
    super(message);
    this.status = status;
    this.offline = offline;
  }

  /** Errors about one note (bad input) rather than the connection or server. */
  get isNoteRejected() {
    return this.status === 400 || this.status === 413;
  }
}

/** Accepts "host", "https://host", or the old app's ".../notes" form. */
export function normalizeServerUrl(url) {
  let base = url.trim().replace(/\/+$/, '').replace(/\/notes$/, '');
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base;
}

export function createApi({ serverUrl, apiToken, username }) {
  const base = normalizeServerUrl(serverUrl);

  async function call(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
          ...(username ? { 'X-Arcanist-User': username } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError("Can't reach the server", { offline: true });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        response.status === 401 ? 'The server rejected the API token' : data?.error || `Server error ${response.status}`;
      throw new ApiError(message, { status: response.status });
    }
    return data;
  }

  return {
    health: () => call('GET', '/health'),
    fetchChanges: (since) => call('GET', `/notes?since=${since}`),
    saveNote: (note) =>
      call('PUT', `/notes/${encodeURIComponent(note.id)}`, {
        title: note.title,
        html: note.html,
        tags: note.tags,
        shared: note.shared,
        createdAt: note.createdAt,
      }),
    deleteNote: (id) => call('DELETE', `/notes/${encodeURIComponent(id)}`),
  };
}
