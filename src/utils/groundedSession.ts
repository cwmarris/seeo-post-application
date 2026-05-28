const SESSION_STORAGE_KEY = 'seeo_grounded_session_id';

let inMemorySessionId: string | null = null;

function readStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    return existing?.trim() || null;
  } catch {
    return null;
  }
}

function persistSessionId(id: string): void {
  inMemorySessionId = id;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    // Private mode / blocked storage: keep in-memory id for this tab.
  }
}

export function getGroundedSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-placeholder';
  }

  const stored = readStoredSessionId();
  if (stored) {
    inMemorySessionId = stored;
    return stored;
  }

  if (inMemorySessionId) return inMemorySessionId;

  const id = crypto.randomUUID();
  persistSessionId(id);
  return id;
}
