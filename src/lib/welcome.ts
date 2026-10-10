// Remembers whether a user has already been greeted on their dashboard.
// The first time a freshly registered user reaches the dashboard they see
// "Welcome"; every later visit shows "Welcome back".
//
// The marker lives in this browser's localStorage, keyed by user id, so it
// never touches the shared database and cannot be spoofed into extra trials.

const KEY_PREFIX = "ls-dashboard-welcome:";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasSeenDashboardWelcome(userId: string): boolean {
  const store = storage();
  if (!store || !userId) return false;
  try {
    return store.getItem(KEY_PREFIX + userId) !== null;
  } catch {
    return false;
  }
}

export function markDashboardWelcomeSeen(userId: string): void {
  const store = storage();
  if (!store || !userId) return;
  try {
    store.setItem(KEY_PREFIX + userId, new Date().toISOString());
  } catch {
    // Private mode or a full quota: the greeting just stays on "Welcome".
  }
}

export function clearDashboardWelcome(userId: string): void {
  const store = storage();
  if (!store || !userId) return;
  try {
    store.removeItem(KEY_PREFIX + userId);
  } catch {
    // Nothing to clean up.
  }
}
