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
    const raw = localStorage.getItem(getTenantStorageKey(baseKey, userOrSession));
    if (raw !== null) return JSON.parse(raw);
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

/**
 * Checks if non-empty legacy unscoped data exists for a specific module key.
 * Does not inspect, expose, or infer data ownership.
 */
export function hasLegacyModuleData(baseKey) {
  try {
    const raw = localStorage.getItem(baseKey);
    if (!raw) return false;
    const trimmed = raw.trim();
    return trimmed !== '' && trimmed !== '{}' && trimmed !== '[]' && trimmed !== 'null';
  } catch {
    return false;
  }
}

/**
 * Records per-module awaiting-recovery status into a tenant-scoped audit key.
 * Never modifies or touches legacy data keys.
 */
export function recordLegacyRecoveryStatus(baseKey, status, userOrSession = null) {
  try {
    const statusKey = getTenantStorageKey('ia_legacy_recovery_status', userOrSession);
    const existingRaw = localStorage.getItem(statusKey);
    const current = existingRaw ? JSON.parse(existingRaw) : {};
    current[baseKey] = {
      status,
      recordedAt: new Date().toISOString()
    };
    localStorage.setItem(statusKey, JSON.stringify(current));
  } catch (err) {
    console.warn('Error recording legacy recovery status:', err);
  }
}

/**
 * Retrieves the recorded recovery status for a tenant workspace.
 */
export function getLegacyRecoveryStatus(userOrSession = null) {
  try {
    const statusKey = getTenantStorageKey('ia_legacy_recovery_status', userOrSession);
    const raw = localStorage.getItem(statusKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
