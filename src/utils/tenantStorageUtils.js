// Shared browser storage helpers for tenant-scoped application data.
// Legacy unscoped data is readable only by admin; it is never a fallback for an auditor tenant.

function resolveUsername(userOrSession) {
  return typeof userOrSession === 'string'
    ? userOrSession
    : userOrSession?.username || null;
}

export function getTenantStorageKey(baseKey, userOrSession = null) {
  const username = resolveUsername(userOrSession);
  if (!username || username.toLowerCase() === 'admin') {
    return `${baseKey}_tenant_admin`;
  }
  return `${baseKey}_tenant_${username.toLowerCase()}`;
}

export function loadTenantData(baseKey, defaultVal = null, userOrSession = null) {
  try {
    const username = resolveUsername(userOrSession);
    const raw = localStorage.getItem(getTenantStorageKey(baseKey, userOrSession));
    if (raw !== null) return JSON.parse(raw);

    // Backward compatibility: only admin may read the unscoped legacy key.
    if (!username || username.toLowerCase() === 'admin') {
      const legacy = localStorage.getItem(baseKey);
      if (legacy !== null) return JSON.parse(legacy);
    }
  } catch (error) {
    console.warn(`Error loading tenant data for ${baseKey}:`, error);
  }
  return defaultVal;
}

export function saveTenantData(baseKey, value, userOrSession = null) {
  try {
    localStorage.setItem(getTenantStorageKey(baseKey, userOrSession), JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving tenant data for ${baseKey}:`, error);
  }
}
