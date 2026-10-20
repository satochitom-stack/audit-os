// Shared browser storage helpers for tenant-scoped application data.
// Legacy unscoped data is readable only by admin; it is never a fallback for an auditor tenant.

function resolveUsername(userOrSession) {
  if (typeof userOrSession === 'string') {
    return userOrSession.trim();
  }
  return userOrSession?.username ? String(userOrSession.username).trim() : null;
}

export function getTenantIdentifier(userOrSession = null) {
  const username = resolveUsername(userOrSession);
  if (!username || username.toLowerCase() === 'admin') {
    return 'admin';
  }
  return username.toLowerCase();
}

export function getTenantStorageKey(baseKey, userOrSession = null) {
  const tenant = getTenantIdentifier(userOrSession);
  return `${baseKey}_tenant_${tenant}`;
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
  'ia_risk_feedback_linkages_by_year',
  'ia_central_calendar_events',
  'ia_dept_office_data',
  'ia_dept_finance_data',
  'ia_dept_tech_data',
  'ia_dept_education_data',
  'ia_dept_welfare_data',
  'ia_dept_public_health_data',
  'ia_dept_cdc_charoen_data',
  'ia_dept_cdc_fangthoeng_data',
  'ia_executive_directives',
  'ia_public_overview_data'
];

/**
 * Unscoped keys used by earlier Audit OS versions. They are detected for recovery
 * but are never automatically copied into a tenant workspace because ownership is unknown.
 */
export const LEGACY_RECOVERY_BASE_KEYS = Array.from(new Set([
  ...SCOPED_BASE_KEYS,
  'ia_annual_plans',
  'ia_working_papers',
  'ia_risk_assessments',
  'ia_internal_controls',
  'ia_risk_management',
  'ia_lpa_indicators',
  'ia_audit_charter',
  'ia_audit_universe',
  'ia_engagement_plans',
  'ia_capa_findings',
  'ia_risk_feedback_linkages'
]));

/**
 * Creates a preservation-only bundle of unscoped legacy values for a person to
 * review or hand to an administrator. It does not migrate or assign ownership.
 */
export function buildLegacyRecoveryBundle(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  const entries = {};
  if (!storage || typeof storage.getItem !== 'function') {
    return {
      schema: 'audit-os-legacy-recovery-bundle/v1',
      exportedAt: new Date().toISOString(),
      warning: 'Legacy data ownership has not been verified. Do not import into a tenant without review.',
      entries
    };
  }

  LEGACY_RECOVERY_BASE_KEYS.forEach((baseKey) => {
    try {
      const rawValue = storage.getItem(baseKey);
      if (rawValue === null || typeof rawValue !== 'string') return;
      const trimmed = rawValue.trim();
      if (trimmed === '' || trimmed === '{}' || trimmed === '[]' || trimmed === 'null') return;
      entries[baseKey] = { rawValue };
    } catch {
      // Keep the bundle usable when an individual storage key cannot be read.
    }
  });

  return {
    schema: 'audit-os-legacy-recovery-bundle/v1',
    exportedAt: new Date().toISOString(),
    warning: 'Legacy data ownership has not been verified. This file preserves raw values only; it does not migrate data.',
    entries
  };
}

/**
 * Decomposes a storage key into its baseKey and tenantIdentifier.
 * Returns null if the key is not tenant-scoped.
 *
 * @param {string} key - Full storage key
 * @returns {{ baseKey: string, tenant: string } | null}
 */
export function parseTenantStorageKey(key) {
  if (typeof key !== 'string') return null;
  const separator = '_tenant_';
  const sepIndex = key.indexOf(separator);
  if (sepIndex === -1) return null;

  const baseKey = key.slice(0, sepIndex);
  const tenant = key.slice(sepIndex + separator.length);

  return { baseKey, tenant };
}

/**
 * Checks whether a baseKey belongs to a known dynamic audit key pattern.
 * Supports Opening Meeting, Closing Meeting, Follow-up Register, and Audit Committee registers.
 *
 * @param {string} baseKey
 * @returns {boolean}
 */
export function isDynamicAuditBaseKey(baseKey) {
  if (typeof baseKey !== 'string') return false;
  return /^(ia_opening_meeting_|ia_closing_meeting_|ia_followup_register_|ia_audit_comm_)/.test(baseKey);
}

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
  const targetTenant = getTenantIdentifier(session);

  // 1. Remove base scoped keys for this tenant
  SCOPED_BASE_KEYS.forEach((baseKey) => {
    const scopedKey = getTenantStorageKey(baseKey, session);
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(scopedKey);
    } else if (typeof storage.delete === 'function') {
      storage.delete(scopedKey);
    }
    if (!removedKeys.includes(scopedKey)) {
      removedKeys.push(scopedKey);
    }
  });

  // 2. Remove dynamic scoped keys (e.g. opening meeting, closing meeting, followup register)
  // Scans all keys and parses exact tenant owner, avoiding any suffix-based collisions
  const dynamicKeysToRemove = [];

  const checkAndCollectKey = (key) => {
    if (!key || typeof key !== 'string') return;
    const parsed = parseTenantStorageKey(key);
    if (!parsed) return;

    // Never remove tenant legacy recovery marker
    if (parsed.baseKey === 'ia_legacy_recovery_status') return;

    // Exact tenant ownership match: parsed.tenant must strictly equal targetTenant
    if (parsed.tenant === targetTenant && (isDynamicAuditBaseKey(parsed.baseKey) || SCOPED_BASE_KEYS.includes(parsed.baseKey))) {
      if (!dynamicKeysToRemove.includes(key)) {
        dynamicKeysToRemove.push(key);
      }
    }
  };

  if (typeof storage.length === 'number' && typeof storage.key === 'function') {
    const length = storage.length;
    for (let index = 0; index < length; index += 1) {
      const key = storage.key(index);
      checkAndCollectKey(key);
    }
  } else if (typeof storage.keys === 'function') {
    for (const key of storage.keys()) {
      checkAndCollectKey(key);
    }
  } else if (typeof storage === 'object' && storage !== null) {
    for (const key of Object.keys(storage)) {
      checkAndCollectKey(key);
    }
  }

  dynamicKeysToRemove.forEach((key) => {
    if (typeof storage.removeItem === 'function') {
      storage.removeItem(key);
    } else if (typeof storage.delete === 'function') {
      storage.delete(key);
    }
    if (!removedKeys.includes(key)) {
      removedKeys.push(key);
    }
  });

  return removedKeys;
}
