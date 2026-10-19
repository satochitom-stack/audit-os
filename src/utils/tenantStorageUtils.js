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

/**
 * Base audit keys that are scoped per tenant.
 */
export const SCOPED_BASE_KEYS = [
  'ia_annual_plans_by_year',
  'ia_working_papers_by_year',
  'ia_risk_assessments_by_year',
  'ia_internal_controls_by_year',
  'ia_risk_management_by_year',
  'ia_lpa_indicators_by_year',
  'ia_audit_charter_by_year',
  'ia_audit_universe_by_year',
  'ia_engagement_plans_by_year',
  'ia_org_profile',
  'ia_strategic_plan',
  'ia_strategic_activities_v2',
  'ia_capa_findings_by_year',
  'ia_risk_feedback_linkages_by_year'
];

/**
 * Clears the active tenant's scoped lifecycle records from storage.
 * Only keys scoped to this tenant are removed.
 * Legacy unscoped keys and other tenants' keys are NEVER deleted.
 *
 * @param {object|string} session - Active user session or username
 * @param {Storage} [storage=localStorage] - Storage implementation
 * @returns {string[]} List of keys removed
 */
export function clearTenantStorage(session, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return [];
  const removedKeys = [];

  // 1. Remove base scoped keys for this tenant
  SCOPED_BASE_KEYS.forEach((baseKey) => {
    const scopedKey = getTenantStorageKey(baseKey, session);
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(scopedKey);
    } else if (typeof storage.delete === 'function') {
      storage.delete(scopedKey);
    }
    removedKeys.push(scopedKey);
  });

  // 2. Remove dynamic scoped keys (e.g. opening meeting, closing meeting, followup register)
  const scopedSampleKey = getTenantStorageKey('__audit_os_scope__', session);
  const scopedSuffix = scopedSampleKey.slice('__audit_os_scope__'.length);
  const dynamicKeysToRemove = [];

  if (typeof storage.length === 'number' && typeof storage.key === 'function') {
    const length = storage.length;
    for (let index = 0; index < length; index += 1) {
      const key = storage.key(index);
      if (
        key &&
        key.endsWith(scopedSuffix) &&
        /^(ia_opening_meeting_|ia_closing_meeting_|ia_followup_register_)/.test(key)
      ) {
        dynamicKeysToRemove.push(key);
      }
    }
  } else if (typeof storage.keys === 'function') {
    for (const key of storage.keys()) {
      if (
        key &&
        key.endsWith(scopedSuffix) &&
        /^(ia_opening_meeting_|ia_closing_meeting_|ia_followup_register_)/.test(key)
      ) {
        dynamicKeysToRemove.push(key);
      }
    }
  }

  dynamicKeysToRemove.forEach((key) => {
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(key);
    } else if (typeof storage.delete === 'function') {
      storage.delete(key);
    }
    removedKeys.push(key);
  });

  return removedKeys;
}
