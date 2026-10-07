import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Service for Multi-Tenant Data Synchronization with Cloud Firestore
 * All data is isolated under the path:
 * organizations/{orgId}
 * organizations/{orgId}/modules/{moduleKey}
 */

export const TENANT_MODULE_KEYS = {
  PROFILE: 'profile',
  ANNUAL_PLANS: 'annual_plans_by_year',
  AUDIT_UNIVERSE: 'audit_universe_by_year',
  WORKING_PAPERS: 'working_papers_by_year',
  RISK_MANAGEMENT: 'risk_management_by_year',
  INTERNAL_CONTROLS: 'internal_controls_by_year',
  ENGAGEMENT_PLANS: 'engagement_plans_by_year',
  CAPA_FINDINGS: 'capa_findings',
  DEPARTMENTS: 'departments'
};

/**
 * Save or update organization profile
 */
export async function saveTenantOrgProfile(orgId, profileData) {
  if (!orgId) throw new Error('Missing orgId');
  const orgRef = doc(db, 'organizations', orgId);
  await updateDoc(orgRef, {
    ...profileData,
    updatedAt: serverTimestamp()
  });
}

/**
 * Get organization profile from Firestore
 */
export async function getTenantOrgProfile(orgId) {
  if (!orgId) return null;
  const orgRef = doc(db, 'organizations', orgId);
  const snap = await getDoc(orgRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}

/**
 * Save a specific module data under organizations/{orgId}/modules/{moduleKey}
 */
export async function saveTenantModule(orgId, moduleKey, data) {
  if (!orgId || !moduleKey) return;
  try {
    const docRef = doc(db, 'organizations', orgId, 'modules', moduleKey);
    await setDoc(
      docRef,
      {
        data,
        moduleKey,
        orgId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`Error saving tenant module [${moduleKey}] for org [${orgId}]:`, err);
    throw err;
  }
}

/**
 * Load a specific module data
 */
export async function loadTenantModule(orgId, moduleKey) {
  if (!orgId || !moduleKey) return null;
  try {
    const docRef = doc(db, 'organizations', orgId, 'modules', moduleKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.data || null;
    }
    return null;
  } catch (err) {
    console.error(`Error loading tenant module [${moduleKey}]:`, err);
    return null;
  }
}

/**
 * Subscribe to realtime updates for a tenant module
 */
export function subscribeToTenantModule(orgId, moduleKey, onUpdate) {
  if (!orgId || !moduleKey) return () => {};
  const docRef = doc(db, 'organizations', orgId, 'modules', moduleKey);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const payload = snap.data();
        onUpdate(payload?.data);
      }
    },
    (err) => {
      console.warn(`Realtime subscription error on [${moduleKey}]:`, err);
    }
  );
}

/**
 * Save entire tenant state (Profile, Plans, Universe, Papers, Risk, Controls)
 */
export async function syncAllTenantDataToCloud(orgId, fullState) {
  if (!orgId) throw new Error('Missing orgId');

  const promises = [];

  if (fullState.orgProfile) {
    promises.push(saveTenantOrgProfile(orgId, fullState.orgProfile));
  }
  if (fullState.annualPlansByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.ANNUAL_PLANS, fullState.annualPlansByYear));
  }
  if (fullState.auditUniverseByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.AUDIT_UNIVERSE, fullState.auditUniverseByYear));
  }
  if (fullState.workingPapersByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.WORKING_PAPERS, fullState.workingPapersByYear));
  }
  if (fullState.riskManagementByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.RISK_MANAGEMENT, fullState.riskManagementByYear));
  }
  if (fullState.internalControlsByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.INTERNAL_CONTROLS, fullState.internalControlsByYear));
  }
  if (fullState.engagementPlansByYear) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.ENGAGEMENT_PLANS, fullState.engagementPlansByYear));
  }
  if (fullState.capaFindings) {
    promises.push(saveTenantModule(orgId, TENANT_MODULE_KEYS.CAPA_FINDINGS, fullState.capaFindings));
  }

  await Promise.all(promises);
}

/**
 * Pull all tenant data from Cloud Firestore
 */
export async function pullAllTenantDataFromCloud(orgId) {
  if (!orgId) return null;

  const [
    profile,
    annualPlans,
    auditUniverse,
    workingPapers,
    riskManagement,
    internalControls,
    engagementPlans,
    capaFindings
  ] = await Promise.all([
    getTenantOrgProfile(orgId),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.ANNUAL_PLANS),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.AUDIT_UNIVERSE),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.WORKING_PAPERS),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.RISK_MANAGEMENT),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.INTERNAL_CONTROLS),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.ENGAGEMENT_PLANS),
    loadTenantModule(orgId, TENANT_MODULE_KEYS.CAPA_FINDINGS)
  ]);

  return {
    orgProfile: profile,
    annualPlansByYear: annualPlans,
    auditUniverseByYear: auditUniverse,
    workingPapersByYear: workingPapers,
    riskManagementByYear: riskManagement,
    internalControlsByYear: internalControls,
    engagementPlansByYear: engagementPlans,
    capaFindings
  };
}
