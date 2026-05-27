const SESSION_STORAGE_KEY = 'seeo_grounded_session_id';

export function getGroundedSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-placeholder';
  }

  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing?.trim()) return existing.trim();

  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}
