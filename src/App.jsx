import React, { useState, useEffect, useRef } from 'react';
import { Cloud, X, UserCheck } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PlanningView from './components/PlanningView';
import ExecutionView from './components/ExecutionView';
import ReportingView from './components/ReportingView';
import InternalControlView from './components/InternalControlView';
import RiskManagementView from './components/RiskManagementView';
import LpaView from './components/LpaView';
import KnowledgeView from './components/KnowledgeView';
import FormsView from './components/FormsView';
import LoginView from './components/LoginView';
import WelcomeView from './components/WelcomeView';
import ChangePasswordModal from './components/ChangePasswordModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import CloudSyncModal from './components/CloudSyncModal';
import OnboardingModal from './components/OnboardingModal';
import DlaTemplateModal from './components/DlaTemplateModal';
import { onFirebaseAuthStateChanged, logoutFirebase } from './services/firebaseAuthService';
import {
  saveTenantOrgProfile,
  saveTenantModule,
  pullAllTenantDataFromCloud,
  TENANT_MODULE_KEYS
} from './services/firebaseTenantService';
import AuditRiskView, { defaultAuditUniverse } from './components/AuditRiskView';
import EngagementPlanView from './components/EngagementPlanView';
import UserManagementView from './components/UserManagementView';
import TechnicalToolkitsView from './components/TechnicalToolkitsView';
import DepartmentWorkspaceView from './components/DepartmentWorkspaceView';
import ExecutiveDashboardView from './components/ExecutiveDashboardView';
import CentralCalendarView from './components/CentralCalendarView';
import PublicOverviewView from './components/PublicOverviewView';
import ErrorBoundary from './components/ErrorBoundary';
import AdminBackofficeView from './components/AdminBackofficeView';
import CentralKnowledgeHubView from './components/CentralKnowledgeHubView';
import StrategicPlanView from './components/StrategicPlanView';
import OpeningMeetingView from './components/OpeningMeetingView';
import ClosingMeetingView from './components/ClosingMeetingView';
import AuditFollowUpView from './components/AuditFollowUpView';
import AuditCommitteeView from './components/AuditCommitteeView';
import SystemUpdateNotification from './components/SystemUpdateNotification';
import { INITIAL_ENGAGEMENT_PLANS } from './data/engagementPlanTemplates';
import {
  getSession,
  checkUserSubscription,
  logout as authLogout,
  switchSessionTo,
  autoRepairDataLinkages,
  getUsers,
  saveUsers,
  pullUsersFromCloud,
  subscribeToCloudUsers,
  getDepartments,
  saveDepartments,
  getPendingUsers,
  pullPendingUsersFromCloud,
  loadTenantData,
  saveTenantData,
  getSystemSettings
} from './utils/auth';
import { cloudSyncService, mergeRiskManagement } from './services/cloudSyncService';
import { isSupabaseConfigured, getSupabaseClient } from './services/supabaseClient';

import {
  initialOrgProfile,
  initialAuditCharter,
  initialFiscalYears,
  initialAnnualPlans,
  initialWorkingPapers,
  initialWorkingPapers2570,
  initialRiskAssessments,
  initialInternalControls,
  createEmptyInternalControls,
  initialRiskManagement,
  createEmptyRiskManagement,
  initialLpaIndicators,
  initialKnowledgeBase,
  initialFormsBase,
  initialStrategicPlan,
  initialCapaFindings
} from './data/initialData';

// Run auto-repair of department linkages and user accounts synchronously before state initialization
try {
  autoRepairDataLinkages();
} catch (e) {
  console.error(e);
}

export default function App() {
  // Authentication State (single-user, client-side session)
  const [session, setSession] = useState(() => getSession());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDlaTemplates, setShowDlaTemplates] = useState(false);
  const [cloudToast, setCloudToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(() => getPendingUsers().length);
  const [systemSettings, setSystemSettings] = useState(() => getSystemSettings());
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState(false);

  // Listen to system settings & broadcast announcements
  useEffect(() => {
    const handleSettingsChanged = (e) => {
      setSystemSettings(e.detail || getSystemSettings());
      setDismissedAnnouncement(false);
    };
    window.addEventListener('ia-settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('ia-settings-changed', handleSettingsChanged);
  }, []);

  // Listen to local pending users list changes
  useEffect(() => {
    const handlePendingChanged = () => {
      setPendingCount(getPendingUsers().length);
    };
    window.addEventListener('ia-pending-users-changed', handlePendingChanged);
    return () => window.removeEventListener('ia-pending-users-changed', handlePendingChanged);
  }, []);

  // Firebase Cloud Firestore Users Synchronization (real-time cross-device sync)
  useEffect(() => {
    pullUsersFromCloud();
    const unsub = subscribeToCloudUsers(() => {
      // Users updated in background
    });
    return () => unsub();
  }, []);

  // Supabase Cloud Realtime listener for pending registrations
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Pull from cloud on mount if admin
    if (session?.role === 'admin') {
      pullPendingUsersFromCloud().then((list) => {
        if (Array.isArray(list)) setPendingCount(list.length);
      });
    }

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('app-profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          pullPendingUsersFromCloud().then((list) => {
            if (Array.isArray(list)) setPendingCount(list.length);
          });
          if (session?.role === 'admin' && payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
            setCloudToast({
              title: '🔔 มีคำขอลงทะเบียนใหม่!',
              message: `ผู้ใช้ @${payload.new.username} (${payload.new.display_name} - ${payload.new.department || 'ไม่ระบุสังกัด'}) ส่งคำขอเข้าใช้งานระบบ`,
              actionTab: 'users',
              type: 'info'
            });
            setTimeout(() => setCloudToast(null), 8000);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [session?.role]);

  // Firebase Multi-Tenant Authentication & Organization Data Listener
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged(async (fbUser) => {
      if (fbUser?.orgId) {
        try {
          const tenantData = await pullAllTenantDataFromCloud(fbUser.orgId);
          if (tenantData) {
            if (tenantData.orgProfile) {
              setOrgProfile((prev) => ({ ...prev, ...tenantData.orgProfile }));
            }
            if (tenantData.annualPlans) {
              setAnnualPlansByYear((prev) => ({ ...prev, ...tenantData.annualPlans }));
            }
            if (tenantData.workingPapers) {
              setWorkingPapersByYear((prev) => ({ ...prev, ...tenantData.workingPapers }));
            }
            if (tenantData.riskManagement) {
              setRiskManagementByYear((prev) => ({ ...prev, ...tenantData.riskManagement }));
            }
          }
        } catch (err) {
          console.warn('Firebase tenant data sync notice:', err);
        }
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Dark Mode State (Default to false for warm white-blue theme)
  const [darkMode, setDarkMode] = useState(() => {
    // Migration: ensure user resets to the new warm white-blue theme by default
    if (localStorage.getItem('ia_theme_white_blue_v2') !== '1') {
      localStorage.setItem('ia_theme_white_blue_v2', '1');
      localStorage.setItem('ia_dark_mode', '0');
      return false;
    }
    const saved = localStorage.getItem('ia_dark_mode');
    if (saved !== null) return saved === '1';
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ia_dark_mode', darkMode ? '1' : '0');
  }, [darkMode]);

  // Migration: Synchronously ensure sample data from D:\ drive is completely purged
  const [fiscalYears, setFiscalYears] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_fiscal_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If stored fiscal years contain 2567 or only 2568, migrate to default ['2569', '2570']
          if (
            parsed.includes('2567') ||
            (parsed.length === 2 && parsed.includes('2567') && parsed.includes('2568')) ||
            (parsed.length === 1 && parsed[0] === '2568') ||
            (parsed.length === 4 && parsed.includes('2569') && parsed.includes('2570'))
          ) {
            return initialFiscalYears;
          }
          return parsed;
        }
      }
      return initialFiscalYears;
    } catch {
      return initialFiscalYears;
    }
  });

  useEffect(() => {
    localStorage.setItem('ia_fiscal_years', JSON.stringify(fiscalYears));
  }, [fiscalYears]);

  // Navigation & Fiscal Year State
  const [selectedYear, setSelectedYear] = useState('2569');
  const [currentTab, setCurrentTab] = useState('welcome');
  const [selectedWp, setSelectedWp] = useState('WP-KTB-01');
  const [activeToolkitTab, setActiveToolkitTab] = useState('factor-f');
  const mainContentRef = useRef(null);

  // บังคับให้การโหลดหน้าเว็บหรือรีเฟรช (F5) กลับไปเริ่มต้นที่จุดบนสุดของหน้าเสมอ
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Auto-scroll main content panel and window to top whenever the active menu/tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [currentTab]);

  const handleSelectTab = (tab) => {
    setCurrentTab(tab);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  };

  // Persistent States - Multi-tenant Dynamic Organization Profile
  const [orgProfile, setOrgProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_org_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialOrgProfile,
          ...parsed,
          name: parsed.name || initialOrgProfile.name,
          district: parsed.district || initialOrgProfile.district,
          province: parsed.province || initialOrgProfile.province,
          approverName: parsed.approverName || initialOrgProfile.approverName,
          palatName: parsed.palatName || initialOrgProfile.palatName,
          auditorName: parsed.auditorName || initialOrgProfile.auditorName,
          auditorPosition: parsed.auditorPosition || initialOrgProfile.auditorPosition,
          fiscalYear: parsed.fiscalYear || initialOrgProfile.fiscalYear
        };
      }
      return initialOrgProfile;
    } catch {
      return initialOrgProfile;
    }
  });

  // Listen for dynamic organization profile changes across windows/components
  useEffect(() => {
    const handleOrgChanged = (e) => {
      if (e?.detail) {
        setOrgProfile((prev) => ({ ...prev, ...e.detail }));
      } else {
        try {
          const raw = localStorage.getItem('ia_org_profile');
          if (raw) setOrgProfile(JSON.parse(raw));
        } catch (err) {}
      }
    };
    window.addEventListener('ia-org-profile-changed', handleOrgChanged);
    return () => window.removeEventListener('ia-org-profile-changed', handleOrgChanged);
  }, []);

  // When session has organization, district, or province, ensure active orgProfile adopts it
  useEffect(() => {
    if (session?.organization) {
      setOrgProfile((prev) => ({
        ...prev,
        name: session.organization || prev.name,
        district: session.district !== undefined && session.district !== '' ? session.district : prev.district,
        province: session.province !== undefined && session.province !== '' ? session.province : prev.province
      }));
    }
  }, [session?.organization, session?.district, session?.province]);

  // Persistent States isolated by fiscal year
  const [annualPlansByYear, setAnnualPlansByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_annual_plans_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        return parsed;
      }
      const old = localStorage.getItem('ia_annual_plans');
      if (old) {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed)) {
          if (parsed.some((p) => p.title?.includes('ค่าเช่าบ้าน') || p.id === 'PLAN-68-01')) {
            return { '2569': [] };
          }
          return { '2569': parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': [] };
  });

  const [workingPapersByYear, setWorkingPapersByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_working_papers_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        if (!parsed['2570'] || parsed['2570'].length === 0) parsed['2570'] = initialWorkingPapers2570;
        return parsed;
      }
      const old = localStorage.getItem('ia_working_papers');
      if (old) {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed)) {
          return { '2569': parsed, '2570': initialWorkingPapers2570 };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': initialWorkingPapers, '2570': initialWorkingPapers2570 };
  });

  const [riskAssessmentsByYear, setRiskAssessmentsByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_risk_assessments_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        return parsed;
      }
      const old = localStorage.getItem('ia_risk_assessments');
      if (old) {
        const parsed = JSON.parse(old);
        if (Array.isArray(parsed)) {
          if (parsed.some((r) => r.activity?.includes('KTB') || r.id === 'RISK-01')) {
            return { '2569': [] };
          }
          return { '2569': parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': [] };
  });

  const [internalControlsByYear, setInternalControlsByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_internal_controls_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        return parsed;
      }
      const old = localStorage.getItem('ia_internal_controls');
      if (old) {
        return { '2569': JSON.parse(old), '2570': createEmptyInternalControls() };
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': initialInternalControls, '2570': createEmptyInternalControls() };
  });

  const [riskManagementByYear, setRiskManagementByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_risk_management_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        // Restore initialRiskManagement if 2569 is empty
        if (!parsed['2569'] || !parsed['2569'].bs1 || parsed['2569'].bs1.length === 0) {
          parsed['2569'] = initialRiskManagement;
          try {
            localStorage.setItem('ia_risk_management_by_year', JSON.stringify(parsed));
          } catch (err) {
            console.error(err);
          }
        }
        // Detect if 2570 was poisoned with exact duplicate of 2569 seed data
        if (parsed['2570']?.bs1?.length === 5 && parsed['2570'].bs1[0]?.id === 'BS1-01' && parsed['2570'].bs1[0]?.riskCode === 'RSK-01') {
          parsed['2570'] = createEmptyRiskManagement();
          try {
            localStorage.setItem('ia_risk_management_by_year', JSON.stringify(parsed));
          } catch (err) {
            console.error(err);
          }
        }

        // Clean any duplicate items (e.g. from previous bulk merge)
        let hasDeduped = false;
        ['2569', '2570'].forEach((yr) => {
          if (parsed[yr]) {
            ['bs1', 'bs2', 'bs3', 'bs4'].forEach((key) => {
              if (Array.isArray(parsed[yr][key])) {
                const seen = new Set();
                const initialLen = parsed[yr][key].length;
                parsed[yr][key] = parsed[yr][key].filter((item) => {
                  if (!item) return false;
                  const k = item.id || (item.riskCode ? `${item.riskCode}-${item.department || ''}` : `${item.activity || ''}-${item.department || ''}`);
                  if (seen.has(k)) return false;
                  seen.add(k);
                  return true;
                });
                if (parsed[yr][key].length !== initialLen) hasDeduped = true;
              }
            });
            const bs5List = Array.isArray(parsed[yr].bs5)
              ? parsed[yr].bs5
              : Array.isArray(parsed[yr].bs5?.items)
              ? parsed[yr].bs5.items
              : [];
            if (bs5List.length > 0) {
              const seen = new Set();
              const initialLen = bs5List.length;
              const cleanBs5 = bs5List.filter((item) => {
                if (!item) return false;
                const k = item.id || (item.riskCode ? `${item.riskCode}-${item.department || ''}` : `${item.activity || ''}-${item.department || ''}`);
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
              if (cleanBs5.length !== initialLen) {
                hasDeduped = true;
                if (Array.isArray(parsed[yr].bs5)) {
                  parsed[yr].bs5 = cleanBs5;
                } else if (parsed[yr].bs5?.items) {
                  parsed[yr].bs5.items = cleanBs5;
                }
              }
            }
          }
        });
        if (hasDeduped) {
          try {
            localStorage.setItem('ia_risk_management_by_year', JSON.stringify(parsed));
          } catch (err) {
            console.error(err);
          }
        }

        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': initialRiskManagement, '2570': createEmptyRiskManagement() };
  });

  const [lpaIndicatorsByYear, setLpaIndicatorsByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_lpa_indicators_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        return parsed;
      }
      const old = localStorage.getItem('ia_lpa_indicators');
      if (old) {
        return { '2569': JSON.parse(old) };
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': initialLpaIndicators };
  });

  const [auditCharterByYear, setAuditCharterByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_audit_charter_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569'] && parsed['2568']) parsed['2569'] = parsed['2568'];
        return parsed;
      }
      const old = localStorage.getItem('ia_audit_charter');
      if (old) {
        return { '2569': JSON.parse(old) };
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': initialAuditCharter };
  });

  // Audit Universe Risk Assessment state isolated by fiscal year
  const [auditUniverseByYear, setAuditUniverseByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_audit_universe_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569']) {
          parsed['2569'] = parsed['2568'] || defaultAuditUniverse;
        }
        return parsed;
      }
      return { '2569': defaultAuditUniverse, '2570': defaultAuditUniverse };
    } catch (e) {
      console.error(e);
      return { '2569': defaultAuditUniverse, '2570': defaultAuditUniverse };
    }
  });

  // Audit Engagement Plans state (ว 614) isolated by fiscal year
  const [engagementPlansByYear, setEngagementPlansByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_engagement_plans_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed['2569']) {
          parsed['2569'] = parsed['2568'] || INITIAL_ENGAGEMENT_PLANS;
        }
        return parsed;
      }
      return { '2569': INITIAL_ENGAGEMENT_PLANS, '2570': INITIAL_ENGAGEMENT_PLANS };
    } catch (e) {
      console.error(e);
      return { '2569': INITIAL_ENGAGEMENT_PLANS, '2570': INITIAL_ENGAGEMENT_PLANS };
    }
  });

  // Strategic Multi-Year Audit Plan (3 - 5 ปี) state
  const [strategicPlan, setStrategicPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_strategic_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialStrategicPlan;
  });

  // CAPA Findings Tracker state isolated by fiscal year
  const [capaFindingsByYear, setCapaFindingsByYear] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_capa_findings_by_year');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sampleCapaIds = [
          'CAPA-OAG-69-01', 'CAPA-IA-69-01', 'CAPA-INSP-69-01', 'CAPA-FIN-69-01', 'CAPA-ENG-69-01',
          'CAPA-2569-001', 'CAPA-2569-002', 'CAPA-2569-003'
        ];
        Object.keys(parsed).forEach((yr) => {
          if (Array.isArray(parsed[yr])) {
            parsed[yr] = parsed[yr].filter(
              (c) => !sampleCapaIds.includes(c?.id) &&
                     !sampleCapaIds.includes(c?.code) &&
                     !c?.id?.startsWith('CAPA-IA-') &&
                     !c?.id?.startsWith('CAPA-INSP-') &&
                     !c?.id?.startsWith('CAPA-OAG-') &&
                     !c?.title?.includes('งบกระทบยอดเงินฝาก') &&
                     !c?.title?.includes('แผนที่ภาษี') &&
                     !c?.title?.includes('ค่าเบี้ยยังชีพ') &&
                     !c?.title?.includes('ค่าปรับ')
            );
          }
        });
        if (!parsed['2569']) parsed['2569'] = [];
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return { '2569': [], '2570': [] };
  });

  const [knowledgeBase, setKnowledgeBase] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_knowledge_base');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = initialKnowledgeBase.map((initItem) => {
          const found = parsed.find((p) => p.id === initItem.id);
          return found
            ? { ...initItem, ...found, fileUrl: initItem.fileUrl, downloadUrl: initItem.downloadUrl, fileType: initItem.fileType, fileSize: initItem.fileSize }
            : initItem;
        });
        const userAdded = parsed.filter((p) => !initialKnowledgeBase.some((initItem) => initItem.id === p.id));
        return [...merged, ...userAdded];
      }
      return initialKnowledgeBase;
    } catch {
      return initialKnowledgeBase;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ia_knowledge_base', JSON.stringify(knowledgeBase));
    } catch (e) {
      console.warn('Could not save knowledge base to localStorage:', e);
    }
  }, [knowledgeBase]);

  const [formsBase, setFormsBase] = useState(() => {
    try {
      const saved = localStorage.getItem('ia_forms_base');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = initialFormsBase.map((initItem) => {
          const found = parsed.find((p) => p.id === initItem.id);
          return found
            ? { ...initItem, ...found, fileUrl: initItem.fileUrl, downloadUrl: initItem.downloadUrl, fileType: initItem.fileType, fileSize: initItem.fileSize }
            : initItem;
        });
        const userAdded = parsed.filter((p) => !initialFormsBase.some((initItem) => initItem.id === p.id));
        return [...merged, ...userAdded];
      }
      return initialFormsBase;
    } catch {
      return initialFormsBase;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ia_forms_base', JSON.stringify(formsBase));
    } catch (e) {
      console.warn('Could not save forms base to localStorage:', e);
    }
  }, [formsBase]);

  // Save year-scoped states to localStorage with Multi-Tenant isolation
  useEffect(() => {
    if (session) saveTenantData('ia_org_profile', orgProfile, session);
    localStorage.setItem('ia_org_profile', JSON.stringify(orgProfile));
  }, [orgProfile, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_annual_plans_by_year', annualPlansByYear, session);
    localStorage.setItem('ia_annual_plans_by_year', JSON.stringify(annualPlansByYear));
  }, [annualPlansByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_working_papers_by_year', workingPapersByYear, session);
    localStorage.setItem('ia_working_papers_by_year', JSON.stringify(workingPapersByYear));
  }, [workingPapersByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_risk_assessments_by_year', riskAssessmentsByYear, session);
    localStorage.setItem('ia_risk_assessments_by_year', JSON.stringify(riskAssessmentsByYear));
  }, [riskAssessmentsByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_internal_controls_by_year', internalControlsByYear, session);
    localStorage.setItem('ia_internal_controls_by_year', JSON.stringify(internalControlsByYear));
  }, [internalControlsByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_risk_management_by_year', riskManagementByYear, session);
    localStorage.setItem('ia_risk_management_by_year', JSON.stringify(riskManagementByYear));
  }, [riskManagementByYear, session]);

  // Initialize Cloud Realtime Synchronization (Supabase)
  useEffect(() => {
    let isSubscribed = true;

    const setupSync = async () => {
      if (!isSupabaseConfigured()) return;

      // 1. Initial Pull from Cloud
      try {
        const cloudData = await cloudSyncService.pullAllRiskManagement();
        if (isSubscribed && cloudData && Object.keys(cloudData).length > 0) {
          setRiskManagementByYear((prev) => {
            const next = { ...prev };
            Object.keys(cloudData).forEach((yr) => {
              next[yr] = mergeRiskManagement(next[yr] || createEmptyRiskManagement(), cloudData[yr], session?.department);
            });
            return next;
          });

          // If the user's department already has local items or submitted status, push to Cloud
          if (session?.role !== 'admin' && session?.department) {
            const userDept = session.department;
            const currentYrData = riskManagementByYear[selectedYear] || initialRiskManagement;
            const filterFn = (i) => i && i.department === userDept;
            const bs5List = Array.isArray(currentYrData.bs5) ? currentYrData.bs5 : (currentYrData.bs5?.items || []);
            const deptPayload = {
              bs1: (currentYrData.bs1 || []).filter(filterFn),
              bs2: (currentYrData.bs2 || []).filter(filterFn),
              bs3: (currentYrData.bs3 || []).filter(filterFn),
              bs4: (currentYrData.bs4 || []).filter(filterFn),
              bs5: bs5List.filter(filterFn),
              bs5Summary: currentYrData.bs5Summary || {},
              submissions: currentYrData.submissions?.[userDept] ? { [userDept]: currentYrData.submissions[userDept] } : {}
            };
            if (deptPayload.bs1.length > 0 || currentYrData.submissions?.[userDept]?.status === 'submitted') {
              cloudSyncService.pushDeptRiskManagement(selectedYear, userDept, deptPayload).catch((e) => console.warn('Auto dept sync notice:', e));
            }
          }
        }
      } catch (e) {
        console.warn('Initial cloud pull:', e);
      }

      // 2. Realtime Subscription
      cloudSyncService.initRealtimeSync({
        onRiskManagementUpdate: ({ fiscalYear, department, data }) => {
          if (!fiscalYear || !department || !data) return;
          if (department === 'หน่วยตรวจสอบภายใน' || department === 'ส่วนกลาง') return;
          console.log(`⚡ [App Realtime Update] Dept: ${department}, Year: ${fiscalYear}`);

          setRiskManagementByYear((prev) => {
            const yr = String(fiscalYear);
            const currentYearData = prev[yr] || (yr === '2569' ? initialRiskManagement : createEmptyRiskManagement());

            const dedupeByItem = (list) => {
              const seen = new Set();
              return list.filter((item) => {
                if (!item) return false;
                const k = item.id || (item.riskCode ? `${item.riskCode}-${item.department || ''}` : `${item.activity || ''}-${item.department || ''}`);
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
            };

            const filterOutDept = (list) => (Array.isArray(list) ? list.filter((item) => item.department !== department) : []);
            const nextBs1 = dedupeByItem([...filterOutDept(currentYearData.bs1), ...(Array.isArray(data.bs1) ? data.bs1 : [])]);
            const nextBs2 = dedupeByItem([...filterOutDept(currentYearData.bs2), ...(Array.isArray(data.bs2) ? data.bs2 : [])]);
            const nextBs3 = dedupeByItem([...filterOutDept(currentYearData.bs3), ...(Array.isArray(data.bs3) ? data.bs3 : [])]);
            const nextBs4 = dedupeByItem([...filterOutDept(currentYearData.bs4), ...(Array.isArray(data.bs4) ? data.bs4 : [])]);

            const currentBs5 = currentYearData.bs5 && typeof currentYearData.bs5 === 'object' && !Array.isArray(currentYearData.bs5)
              ? { ...currentYearData.bs5 }
              : { period: 'รอบ 12 เดือน', evaluator: 'คณะทำงานบริหารจัดการความเสี่ยง อปท.', evaluationDate: '', items: [] };
            const currentBs5Items = Array.isArray(currentBs5.items) ? currentBs5.items : [];
            const incomingBs5Items = Array.isArray(data.bs5) ? data.bs5 : (Array.isArray(data.bs5?.items) ? data.bs5.items : []);
            const nextBs5Items = dedupeByItem([...currentBs5Items.filter(item => item.department !== department), ...incomingBs5Items]);
            currentBs5.items = nextBs5Items;

            const nextBs5Summary = { ...(currentYearData.bs5Summary || {}), ...(data.bs5Summary || {}) };
            const nextSubmissions = { ...(currentYearData.submissions || {}) };
            if (data.submissions) {
              Object.entries(data.submissions).forEach(([d, incomingSub]) => {
                const currentSub = nextSubmissions[d];
                // Never downgrade 'reviewed' to 'submitted' or 'draft'
                if (currentSub?.status === 'reviewed' && incomingSub?.status !== 'reviewed') {
                  return;
                }
                nextSubmissions[d] = { ...(currentSub || {}), ...(incomingSub || {}) };
              });
            }

            return {
              ...prev,
              [yr]: {
                ...currentYearData,
                bs1: nextBs1,
                bs2: nextBs2,
                bs3: nextBs3,
                bs4: nextBs4,
                bs5: currentBs5,
                bs5Summary: nextBs5Summary,
                submissions: nextSubmissions
              }
            };
          });

          // Show floating cloud toast
          setCloudToast({
            title: `⚡ ซิงค์ข้อมูลล่าสุดจาก "${department}"`,
            message: `อัปเดตแบบ บส.1 - บส.5 ปีงบ ${fiscalYear} เรียบร้อยแล้ว`,
            type: 'info'
          });
          setTimeout(() => setCloudToast(null), 4000);
        }
      });
    };

    setupSync();

    const handleConfigChange = () => setupSync();
    window.addEventListener('ia-supabase-config-changed', handleConfigChange);

    return () => {
      isSubscribed = false;
      window.removeEventListener('ia-supabase-config-changed', handleConfigChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ia_lpa_indicators_by_year', JSON.stringify(lpaIndicatorsByYear));
  }, [lpaIndicatorsByYear]);

  useEffect(() => {
    localStorage.setItem('ia_audit_charter_by_year', JSON.stringify(auditCharterByYear));
  }, [auditCharterByYear]);

  useEffect(() => {
    if (session) saveTenantData('ia_audit_universe_by_year', auditUniverseByYear, session);
    localStorage.setItem('ia_audit_universe_by_year', JSON.stringify(auditUniverseByYear));
  }, [auditUniverseByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_engagement_plans_by_year', engagementPlansByYear, session);
    localStorage.setItem('ia_engagement_plans_by_year', JSON.stringify(engagementPlansByYear));
  }, [engagementPlansByYear, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_strategic_plan', strategicPlan, session);
    localStorage.setItem('ia_strategic_plan', JSON.stringify(strategicPlan));
  }, [strategicPlan, session]);

  useEffect(() => {
    if (session) saveTenantData('ia_capa_findings_by_year', capaFindingsByYear, session);
    localStorage.setItem('ia_capa_findings_by_year', JSON.stringify(capaFindingsByYear));
  }, [capaFindingsByYear, session]);

  const reloadDataFromStorage = (currentSess = session) => {
    try {
      const org = loadTenantData('ia_org_profile', null, currentSess);
      if (org) setOrgProfile((prev) => ({ ...prev, ...org }));
      const au = loadTenantData('ia_audit_universe_by_year', null, currentSess);
      if (au) setAuditUniverseByYear(au);
      const ap = loadTenantData('ia_annual_plans_by_year', null, currentSess);
      if (ap) setAnnualPlansByYear(ap);
      const ep = loadTenantData('ia_engagement_plans_by_year', null, currentSess);
      if (ep) setEngagementPlansByYear(ep);
      const wp = loadTenantData('ia_working_papers_by_year', null, currentSess);
      if (wp) setWorkingPapersByYear(wp);
      const ra = loadTenantData('ia_risk_assessments_by_year', null, currentSess);
      if (ra) setRiskAssessmentsByYear(ra);
      const ic = loadTenantData('ia_internal_controls_by_year', null, currentSess);
      if (ic) setInternalControlsByYear(ic);
      const rm = loadTenantData('ia_risk_management_by_year', null, currentSess);
      if (rm) setRiskManagementByYear(rm);
      const st = loadTenantData('ia_strategic_plan', null, currentSess);
      if (st) setStrategicPlan(st);
      const cf = loadTenantData('ia_capa_findings_by_year', null, currentSess);
      if (cf) setCapaFindingsByYear(cf);
    } catch (e) {
      console.error(e);
    }
  };

  // Reload isolated data whenever logged-in user changes
  useEffect(() => {
    if (session?.username) {
      reloadDataFromStorage(session);
    }
  }, [session?.username]);

  // Dynamic getters & setters for the currently selected fiscal year
  const auditUniverse = auditUniverseByYear[selectedYear] || defaultAuditUniverse;
  const setAuditUniverse = (updaterOrValue) => {
    setAuditUniverseByYear((prev) => {
      const current = prev[selectedYear] || defaultAuditUniverse;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const engagementPlans = engagementPlansByYear[selectedYear] || INITIAL_ENGAGEMENT_PLANS;
  const setEngagementPlans = (updaterOrValue) => {
    setEngagementPlansByYear((prev) => {
      const current = prev[selectedYear] || INITIAL_ENGAGEMENT_PLANS;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const annualPlans = annualPlansByYear[selectedYear] || [];
  const setAnnualPlans = (updaterOrValue) => {
    setAnnualPlansByYear((prev) => {
      const current = prev[selectedYear] || [];
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const defaultWpForYear = selectedYear === '2570' ? initialWorkingPapers2570 : initialWorkingPapers;
  const workingPapers = workingPapersByYear[selectedYear] || defaultWpForYear;
  const setWorkingPapers = (updaterOrValue) => {
    setWorkingPapersByYear((prev) => {
      const current = prev[selectedYear] || defaultWpForYear;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const riskAssessments = riskAssessmentsByYear[selectedYear] || [];
  const setRiskAssessments = (updaterOrValue) => {
    setRiskAssessmentsByYear((prev) => {
      const current = prev[selectedYear] || [];
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const internalControls = internalControlsByYear[selectedYear] || (selectedYear === '2569' ? initialInternalControls : createEmptyInternalControls());
  const setInternalControls = (updaterOrValue) => {
    setInternalControlsByYear((prev) => {
      const current = prev[selectedYear] || (selectedYear === '2569' ? initialInternalControls : createEmptyInternalControls());
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const riskManagement = riskManagementByYear[selectedYear] || (selectedYear === '2569' ? initialRiskManagement : createEmptyRiskManagement());
  const setRiskManagement = (updaterOrValue) => {
    setRiskManagementByYear((prev) => {
      const current = prev[selectedYear] || (selectedYear === '2569' ? initialRiskManagement : createEmptyRiskManagement());
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;

      // Auto-push to Supabase Cloud if configured
      if (isSupabaseConfigured()) {
        const userDept = session?.department || 'สำนักปลัด';
        if (session?.role === 'admin') {
          // Admin pushes all departments properly partitioned into their own individual rows
          cloudSyncService.pushAllRiskManagement({ [selectedYear]: updated }, [
            'สำนักปลัด', 'กองคลัง', 'กองช่าง', 'กองการศึกษา', 'กองสวัสดิการสังคม'
          ]).catch((e) => console.warn('Auto cloud push notice:', e));
        } else {
          // Regular user pushes only their own department's payload
          const filterFn = (i) => i && i.department === userDept;
          const bs5Items = Array.isArray(updated.bs5)
            ? updated.bs5
            : Array.isArray(updated.bs5?.items)
            ? updated.bs5.items
            : [];

          const deptPayload = {
            bs1: (Array.isArray(updated.bs1) ? updated.bs1 : []).filter(filterFn),
            bs2: (Array.isArray(updated.bs2) ? updated.bs2 : []).filter(filterFn),
            bs3: (Array.isArray(updated.bs3) ? updated.bs3 : []).filter(filterFn),
            bs4: (Array.isArray(updated.bs4) ? updated.bs4 : []).filter(filterFn),
            bs5: bs5Items.filter(filterFn),
            bs5Summary: updated.bs5Summary || {},
            submissions: updated.submissions?.[userDept] ? { [userDept]: updated.submissions[userDept] } : {}
          };
          cloudSyncService.pushDeptRiskManagement(selectedYear, userDept, deptPayload).catch((e) => console.warn('Auto cloud push notice:', e));
        }
      }

      return { ...prev, [selectedYear]: updated };
    });
  };

  const lpaIndicators = lpaIndicatorsByYear[selectedYear] || initialLpaIndicators;
  const setLpaIndicators = (updaterOrValue) => {
    setLpaIndicatorsByYear((prev) => {
      const current = prev[selectedYear] || initialLpaIndicators;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const auditCharter = auditCharterByYear[selectedYear] || initialAuditCharter;
  const setAuditCharter = (updaterOrValue) => {
    setAuditCharterByYear((prev) => {
      const current = prev[selectedYear] || initialAuditCharter;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  const capaFindings = capaFindingsByYear[selectedYear] || initialCapaFindings;
  const setCapaFindings = (updaterOrValue) => {
    setCapaFindingsByYear((prev) => {
      const current = prev[selectedYear] || initialCapaFindings;
      const updated = typeof updaterOrValue === 'function' ? updaterOrValue(current) : updaterOrValue;
      return { ...prev, [selectedYear]: updated };
    });
  };

  // Actions
  const handleSaveProfile = (newProfile) => {
    setOrgProfile(newProfile);
    if (session) {
      saveTenantData('ia_org_profile', newProfile, session);
      const updatedSession = {
        ...session,
        organization: newProfile.name || session.organization,
        district: newProfile.district !== undefined ? newProfile.district : session.district,
        province: newProfile.province !== undefined ? newProfile.province : session.province
      };
      setSession(updatedSession);
      try {
        localStorage.setItem('ia_session', JSON.stringify(updatedSession));
      } catch (_) {}
    }
    localStorage.setItem('ia_org_profile', JSON.stringify(newProfile));

    if (session?.username) {
      const users = getUsers();
      const idx = users.findIndex((u) => (u.username || '').toLowerCase() === session.username.toLowerCase());
      if (idx !== -1) {
        users[idx].organization = newProfile.name || users[idx].organization;
        users[idx].district = newProfile.district !== undefined ? newProfile.district : users[idx].district;
        users[idx].province = newProfile.province !== undefined ? newProfile.province : users[idx].province;
        saveUsers(users);
      }
    }

    window.dispatchEvent(new CustomEvent('ia-org-profile-changed', { detail: newProfile }));
  };

  const handleCompleteOnboarding = async (newProfile) => {
    const updated = {
      ...orgProfile,
      ...newProfile,
      name: newProfile.name || orgProfile.name,
      district: newProfile.district || orgProfile.district,
      province: newProfile.province || orgProfile.province,
      approverName: newProfile.approverName || orgProfile.approverName,
      palatName: newProfile.palatName || orgProfile.palatName,
      auditorName: newProfile.auditorName || orgProfile.auditorName,
      auditorPosition: newProfile.auditorPosition || orgProfile.auditorPosition,
      fiscalYear: newProfile.fiscalYear || orgProfile.fiscalYear
    };
    setOrgProfile(updated);
    localStorage.setItem('ia_org_profile', JSON.stringify(updated));
    localStorage.setItem('audit_os_onboarded', 'true');
    setShowOnboarding(false);

    const orgId = session?.orgId || newProfile?.orgId || 'org-default';
    try {
      await saveTenantOrgProfile(orgId, updated);
    } catch (err) {
      console.warn('Tenant profile save error:', err);
    }
  };

  const handleAddYear = (newYear) => {
    if (!fiscalYears.includes(newYear)) {
      const updated = [...fiscalYears, newYear].sort();
      setFiscalYears(updated);
      setSelectedYear(newYear);
      // Pre-seed clean empty structures for new fiscal year
      setRiskManagementByYear((prev) => ({
        ...prev,
        [newYear]: createEmptyRiskManagement()
      }));
      setInternalControlsByYear((prev) => ({
        ...prev,
        [newYear]: createEmptyInternalControls()
      }));
      setAnnualPlansByYear((prev) => ({
        ...prev,
        [newYear]: []
      }));
      setRiskAssessmentsByYear((prev) => ({
        ...prev,
        [newYear]: []
      }));
    }
  };

  const handleDeleteYear = (yearToDelete) => {
    if (fiscalYears.length <= 1) return;
    const updated = fiscalYears.filter((y) => y !== yearToDelete);
    setFiscalYears(updated);
    if (selectedYear === yearToDelete) {
      setSelectedYear(updated[0]);
    }
  };

  // Reset to clean blank state (clears all sample records completely)
  const handleResetData = () => {
    setAnnualPlansByYear({ [selectedYear]: [] });
    setWorkingPapersByYear({ [selectedYear]: initialWorkingPapers });
    setRiskAssessmentsByYear({ [selectedYear]: [] });
    setInternalControlsByYear({ [selectedYear]: initialInternalControls });
    setRiskManagementByYear({ [selectedYear]: initialRiskManagement });
    setLpaIndicatorsByYear({ [selectedYear]: initialLpaIndicators });
    setAuditCharterByYear({ [selectedYear]: initialAuditCharter });
    setAuditUniverseByYear({ [selectedYear]: defaultAuditUniverse });
    setEngagementPlansByYear({ [selectedYear]: INITIAL_ENGAGEMENT_PLANS });
    setOrgProfile(initialOrgProfile);
    localStorage.removeItem('ia_annual_plans_by_year');
    localStorage.removeItem('ia_working_papers_by_year');
    localStorage.removeItem('ia_risk_assessments_by_year');
    localStorage.removeItem('ia_internal_controls_by_year');
    localStorage.removeItem('ia_risk_management_by_year');
    localStorage.removeItem('ia_lpa_indicators_by_year');
    localStorage.removeItem('ia_audit_charter_by_year');
    localStorage.removeItem('ia_audit_universe_by_year');
    localStorage.removeItem('ia_engagement_plans_by_year');
    localStorage.removeItem('ia_org_profile');
    localStorage.removeItem('ia_annual_plans');
    localStorage.removeItem('ia_working_papers');
    localStorage.removeItem('ia_risk_assessments');
    localStorage.removeItem('ia_internal_controls');
    localStorage.removeItem('ia_risk_management');
    localStorage.removeItem('ia_lpa_indicators');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const data = {
      version: '2.4',
      exportedAt: new Date().toISOString(),
      users: getUsers(),
      departments: getDepartments(),
      orgProfile,
      fiscalYears,
      selectedYear,
      auditUniverseByYear,
      engagementPlansByYear,
      annualPlansByYear,
      workingPapersByYear,
      riskAssessmentsByYear,
      internalControlsByYear,
      riskManagementByYear,
      lpaIndicatorsByYear,
      auditCharterByYear,
      strategicPlan,
      capaFindingsByYear
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IA-OS_Backup_${orgProfile.name || 'อปท'}_${selectedYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (data) => {
    if (data.users && Array.isArray(data.users)) saveUsers(data.users);
    if (data.departments && Array.isArray(data.departments)) saveDepartments(data.departments);
    if (data.orgProfile) setOrgProfile(data.orgProfile);
    if (data.fiscalYears) setFiscalYears(data.fiscalYears);
    if (data.auditUniverseByYear) setAuditUniverseByYear(data.auditUniverseByYear);
    else if (data.auditUniverse) setAuditUniverseByYear({ [selectedYear]: data.auditUniverse });
    if (data.engagementPlansByYear) setEngagementPlansByYear(data.engagementPlansByYear);
    else if (data.engagementPlans) setEngagementPlansByYear({ [selectedYear]: data.engagementPlans });
    if (data.annualPlansByYear) setAnnualPlansByYear(data.annualPlansByYear);
    else if (data.annualPlans) setAnnualPlansByYear({ [selectedYear]: data.annualPlans });
    if (data.workingPapersByYear) setWorkingPapersByYear(data.workingPapersByYear);
    else if (data.workingPapers) setWorkingPapersByYear({ [selectedYear]: data.workingPapers });
    if (data.riskAssessmentsByYear) setRiskAssessmentsByYear(data.riskAssessmentsByYear);
    else if (data.riskAssessments) setRiskAssessmentsByYear({ [selectedYear]: data.riskAssessments });
    if (data.internalControlsByYear) setInternalControlsByYear(data.internalControlsByYear);
    else if (data.internalControls) setInternalControlsByYear({ [selectedYear]: data.internalControls });
    if (data.riskManagementByYear) setRiskManagementByYear(data.riskManagementByYear);
    else if (data.riskManagement) setRiskManagementByYear({ [selectedYear]: data.riskManagement });
    if (data.lpaIndicatorsByYear) setLpaIndicatorsByYear(data.lpaIndicatorsByYear);
    else if (data.lpaIndicators) setLpaIndicatorsByYear({ [selectedYear]: data.lpaIndicators });
    if (data.auditCharterByYear) setAuditCharterByYear(data.auditCharterByYear);
    else if (data.auditCharter) setAuditCharterByYear({ [selectedYear]: data.auditCharter });
    if (data.strategicPlan && Array.isArray(data.strategicPlan)) setStrategicPlan(data.strategicPlan);
    if (data.capaFindingsByYear) setCapaFindingsByYear(data.capaFindingsByYear);
    else if (data.capaFindings) setCapaFindingsByYear({ [selectedYear]: data.capaFindings });
  };

  // Helper: Default landing tab based on role (auditor and admin start on Step 1: Audit Risk)
  const getDefaultTabForUser = (s) => {
    return 'audit-risk';
  };

  // Route Guard: Ensure auditors and admin access appropriate tabs and check subscription
  useEffect(() => {
    if (!session) return;
    if (session.role === 'admin') return;

    // Check expiration lockout (Trial 30 days or expired subscription)
    const sub = checkUserSubscription(session);
    if (sub.expired) {
      if (currentTab !== 'welcome') {
        setCurrentTab('welcome');
      }
      return;
    }

    // All 11 lifecycle steps for auditors
    const allowed = [
      'audit-risk',
      'strategic-plan',
      'planning',
      'engagement-plan',
      'opening-meeting',
      'execution',
      'closing-meeting',
      'reporting',
      'tracking-register',
      'central-hub',
      'audit-toolkits',
      'internal-control',
      'risk-management',
      'lpa',
      'knowledge',
      'forms',
      'welcome'
    ];

    if (!allowed.includes(currentTab)) {
      setCurrentTab('audit-risk');
    }
  }, [session, currentTab]);

  // 1. หน้าแรก (Welcome View / Landing Page)
  if (currentTab === 'welcome') {
    return (
      <>
        <WelcomeView
          session={session}
          orgProfile={orgProfile}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onLogin={(sess) => {
            const s = sess || getSession();
            setSession(s);
            const sub = checkUserSubscription(s);
            if (sub.expired && s.role !== 'admin') {
              setCurrentTab('welcome');
            } else {
              setCurrentTab('audit-risk');
            }
          }}
          onEnterDashboard={() => {
            const sub = checkUserSubscription(session);
            if (sub.expired && session?.role !== 'admin') {
              setCurrentTab('welcome');
            } else {
              setCurrentTab('audit-risk');
            }
          }}
        />
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            initialData={orgProfile}
            onComplete={handleCompleteOnboarding}
            onCancel={() => setShowOnboarding(false)}
          />
        )}
      </>
    );
  }

  // 2. หน้าเข้าสู่ระบบ (หากยังไม่ได้เข้าสู่ระบบและไม่ได้อยู่ในหน้าแรก)
  if (!session) {
    return (
      <LoginView
        orgProfile={orgProfile}
        onLogin={(sess) => {
          const s = sess || getSession();
          setSession(s);
          setCurrentTab('audit-risk');
        }}
        onBackToWelcome={() => setCurrentTab('welcome')}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Firebase logout notice:', e);
    }
    authLogout();
    setSession(null);
    setCurrentTab('welcome');
  };

  const handleCloneToWorkingPapers = (clonedWp) => {
    if (!clonedWp) return;
    setWorkingPapers((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.some((w) => w.id === clonedWp.id)) {
        return list.map((w) => (w.id === clonedWp.id ? { ...w, ...clonedWp } : w));
      }
      return [clonedWp, ...list];
    });
    setSelectedWp(clonedWp.id);
    handleSelectTab('execution');
  };

  const handleNavigateToExecution = (planId) => {
    const wpId = planId?.startsWith('WP-') ? planId : `WP-${planId}`;
    setSelectedWp(wpId);
    handleSelectTab('execution');
  };

  return (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-800 flex flex-col font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <SystemUpdateNotification />
      <Header
        orgProfile={orgProfile}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        fiscalYears={fiscalYears}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((v) => !v)}
        session={session}
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassword(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenUsersManagement={() => handleSelectTab('backoffice')}
        onOpenWelcome={() => handleSelectTab('welcome')}
        onOpenCloudSync={() => setShowCloudSyncModal(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenDlaTemplates={() => setShowDlaTemplates(true)}
        pendingCount={pendingCount}
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
      />

      {/* Real-time Broadcast Announcement Banner จาก Super Admin */}
      {systemSettings?.broadcastActive && systemSettings?.announcement && !dismissedAnnouncement && (
        <div className="bg-gradient-to-r from-stone-900 via-amber-950/90 to-stone-900 text-amber-100 px-4 py-2.5 text-xs border-b border-amber-500/40 flex items-center justify-between shadow-md z-30 shrink-0 backdrop-blur-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide shrink-0 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping inline-block" />
              <span>📢 ประกาศระบบส่วนกลาง</span>
            </span>
            <span className="truncate text-amber-100 font-medium tracking-wide">
              {systemSettings.announcement}
            </span>
          </div>
          <button
            onClick={() => setDismissedAnnouncement(true)}
            className="text-amber-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0 ml-2"
            title="ซ่อนประกาศนี้"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Impersonate / Department Preview Banner (แสดงเฉพาะเมื่อ ADMIN กำลังกดทดสอบมุมมองเท่านั้น) */}
      {session?.isImpersonating && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 text-slate-950 px-4 py-2 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm z-20 shrink-0">
          <div className="flex items-center space-x-2">
            <span>👁️ <strong>โหมดทดสอบมุมมอง (Admin Preview):</strong> คุณกำลังดูหน้าจอในฐานะ {session.displayName || session.username} ({session.department})</span>
            <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">
              (แสดงเฉพาะ {session.permissions?.length || 0} เมนูที่ได้รับอนุญาต)
            </span>
          </div>
          <button
            onClick={() => {
              const adminSess = switchSessionTo('admin', false);
              setSession(adminSess);
              handleSelectTab('users');
            }}
            className="bg-slate-950 hover:bg-slate-900 text-amber-300 border border-amber-300/40 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto shadow-sm"
          >
            <span>✕ ออกจากโหมดทดสอบ (กลับสู่ ADMIN)</span>
          </button>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showSettings && (
        <ProfileSettingsModal
          orgProfile={orgProfile}
          onSaveProfile={handleSaveProfile}
          fiscalYears={fiscalYears}
          onAddYear={handleAddYear}
          onDeleteYear={handleDeleteYear}
          onResetData={handleResetData}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCloudSyncModal && (
        <CloudSyncModal
          isOpen={showCloudSyncModal}
          onClose={() => setShowCloudSyncModal(false)}
          riskManagementByYear={riskManagementByYear}
          setRiskManagementByYear={setRiskManagementByYear}
          selectedYear={selectedYear}
          isAdmin={session?.role === 'admin'}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          initialData={orgProfile}
          onComplete={handleCompleteOnboarding}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {showDlaTemplates && (
        <DlaTemplateModal
          isOpen={showDlaTemplates}
          onClose={() => setShowDlaTemplates(false)}
          onNavigate={(tab) => {
            handleSelectTab(tab);
            setShowDlaTemplates(false);
          }}
        />
      )}

      {/* Cloud Sync / Registration Toast Notification */}
      {cloudToast && (
        <div
          onClick={() => {
            if (cloudToast.actionTab) {
              handleSelectTab(cloudToast.actionTab);
              setCloudToast(null);
            }
          }}
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 flex items-start space-x-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-xs ${
            cloudToast.actionTab ? 'cursor-pointer hover:border-amber-500/80 transition-all' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            {cloudToast.actionTab ? <UserCheck className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
          </div>
          <div className="space-y-0.5 text-xs flex-1">
            <h4 className="font-bold text-slate-100 flex items-center justify-between">
              <span>{cloudToast.title}</span>
              {cloudToast.actionTab && (
                <span className="text-[10px] text-amber-400 font-semibold underline">คลิกเพื่อดูคำขอ</span>
              )}
            </h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">{cloudToast.message}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCloudToast(null);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleSelectTab}
          session={session}
          orgProfile={orgProfile}
          planCount={annualPlans.length}
          activeToolkitTab={activeToolkitTab}
          setActiveToolkitTab={setActiveToolkitTab}
          pendingCount={pendingCount}
          onShowExpiredModal={() => handleSelectTab('welcome')}
        />

        <main ref={mainContentRef} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 bg-[#faf8f5] dark:bg-[#151413] custom-scrollbar print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:m-0 print:p-0">
            <ErrorBoundary key={currentTab} onReset={() => setCurrentTab('dashboard')}>
            {currentTab === 'dashboard' && (
              <DashboardView
                key={`dashboard-${selectedYear}`}
                orgProfile={orgProfile}
                selectedYear={selectedYear}
                annualPlans={annualPlans}
                workingPapers={workingPapers}
                lpaIndicators={lpaIndicators}
                riskAssessments={riskAssessments}
                setCurrentTab={setCurrentTab}
                setSelectedWp={setSelectedWp}
                onOpenSettings={() => setShowSettings(true)}
                session={session}
                onLogout={handleLogout}
              />
            )}

            {currentTab === 'audit-risk' && (
              <AuditRiskView
                key={`audit-risk-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                auditUniverse={auditUniverse}
                setAuditUniverse={setAuditUniverse}
                annualPlans={annualPlans}
                setAnnualPlans={setAnnualPlans}
                setCurrentTab={handleSelectTab}
                session={session}
              />
            )}

            {currentTab === 'strategic-plan' && (
              <StrategicPlanView
                key={`strategic-plan-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                auditUniverse={auditUniverse}
                annualPlans={annualPlans}
              />
            )}

            {currentTab === 'planning' && (
              <PlanningView
                key={`planning-${selectedYear}`}
                selectedYear={selectedYear}
                auditCharter={auditCharter}
                annualPlans={annualPlans}
                setAnnualPlans={setAnnualPlans}
                riskAssessments={riskAssessments}
                setRiskAssessments={setRiskAssessments}
                auditUniverse={auditUniverse}
                setAuditUniverse={setAuditUniverse}
                engagementPlans={engagementPlans}
                setEngagementPlans={setEngagementPlans}
                strategicPlan={strategicPlan}
                setStrategicPlan={setStrategicPlan}
                orgProfile={orgProfile}
                setCurrentTab={handleSelectTab}
              />
            )}

            {currentTab === 'engagement-plan' && (
              <EngagementPlanView
                key={`engagement-plan-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                auditUniverse={auditUniverse}
                annualPlans={annualPlans}
                engagementPlans={engagementPlans}
                setEngagementPlans={setEngagementPlans}
                onNavigateToExecution={handleNavigateToExecution}
              />
            )}

            {currentTab === 'opening-meeting' && (
              <OpeningMeetingView
                key={`opening-meeting-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                annualPlans={annualPlans}
              />
            )}

            {currentTab === 'execution' && (
              <ExecutionView
                key={`execution-${selectedYear}`}
                selectedYear={selectedYear}
                workingPapers={workingPapers}
                setWorkingPapers={setWorkingPapers}
                selectedWp={selectedWp}
                setSelectedWp={setSelectedWp}
                orgProfile={orgProfile}
                engagementPlans={engagementPlans}
                onNavigateToTab={handleSelectTab}
              />
            )}

            {currentTab === 'closing-meeting' && (
              <ClosingMeetingView
                key={`closing-meeting-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                annualPlans={annualPlans}
                workingPapers={workingPapers}
                onNavigateToTab={handleSelectTab}
              />
            )}

            {currentTab === 'tracking-register' && (
              <AuditFollowUpView
                key={`tracking-register-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                capaFindings={capaFindings}
                setCapaFindings={setCapaFindings}
              />
            )}

            {currentTab === 'audit-committee' && (
              <AuditCommitteeView
                key={`audit-committee-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                annualPlans={annualPlans}
              />
            )}

            {currentTab === 'central-hub' && (
              <CentralKnowledgeHubView
                key={`central-hub-${selectedYear}`}
                session={session}
                onCloneToWorkingPapers={handleCloneToWorkingPapers}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'audit-toolkits' && (
              <TechnicalToolkitsView
                key={`toolkits-${selectedYear}`}
                selectedYear={selectedYear}
                workingPapers={workingPapers}
                setWorkingPapers={setWorkingPapers}
                setSelectedWp={setSelectedWp}
                setCurrentTab={handleSelectTab}
                initialTool={activeToolkitTab}
              />
            )}

            {currentTab === 'reporting' && (
              <ReportingView
                key={`reporting-${selectedYear}`}
                selectedYear={selectedYear}
                orgProfile={orgProfile}
                annualPlans={annualPlans}
                workingPapers={workingPapers}
                capaFindings={capaFindings}
                setCapaFindings={setCapaFindings}
                auditUniverse={auditUniverse}
                engagementPlans={engagementPlans}
                session={session}
                onNavigateToTab={handleSelectTab}
              />
            )}

            {currentTab === 'public-overview' && (
              <PublicOverviewView
                key={`public-overview-${selectedYear}`}
                orgProfile={orgProfile}
                selectedYear={selectedYear}
                session={session}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'executive-dashboard' && (
              <ExecutiveDashboardView
                key={`executive-dashboard-${selectedYear}`}
                orgProfile={orgProfile}
                selectedYear={selectedYear}
                annualPlans={annualPlans}
                workingPapers={workingPapers}
                capaFindings={capaFindings}
                setCurrentTab={setCurrentTab}
              />
            )}

            {currentTab === 'central-calendar' && (
              <CentralCalendarView
                key={`central-calendar-${selectedYear}`}
                selectedYear={selectedYear}
                annualPlans={annualPlans}
                session={session}
                setCurrentTab={setCurrentTab}
              />
            )}

            {(currentTab === 'dept-office' ||
              currentTab === 'dept-finance' ||
              currentTab === 'dept-tech' ||
              currentTab === 'dept-education' ||
              currentTab === 'dept-welfare' ||
              currentTab === 'dept-cdc-charoen' ||
              currentTab === 'dept-cdc-fangthoeng') && (
              <DepartmentWorkspaceView
                key={`dept-${currentTab}-${selectedYear}`}
                orgProfile={orgProfile}
                selectedYear={selectedYear}
                session={session}
                capaFindings={capaFindings}
                setCapaFindings={setCapaFindings}
                initialDepartment={
                  currentTab === 'dept-office'
                    ? 'สำนักปลัด'
                    : currentTab === 'dept-finance'
                    ? 'กองคลัง'
                    : currentTab === 'dept-tech'
                    ? 'กองช่าง'
                    : currentTab === 'dept-education'
                    ? 'กองการศึกษา'
                    : currentTab === 'dept-welfare'
                    ? 'กองสวัสดิการสังคม'
                    : currentTab === 'dept-cdc-charoen'
                    ? 'ศพด.วัดเจริญทัศน์'
                    : currentTab === 'dept-cdc-fangthoeng'
                    ? 'ศพด.บ้านฝางเทิง'
                    : (session?.department?.includes('คลัง')
                        ? 'กองคลัง'
                        : session?.department?.includes('ช่าง')
                        ? 'กองช่าง'
                        : session?.department?.includes('การศึกษา')
                        ? 'กองการศึกษา'
                        : session?.department?.includes('สวัสดิการ')
                        ? 'กองสวัสดิการสังคม'
                        : session?.department?.includes('เจริญทัศน์')
                        ? 'ศพด.วัดเจริญทัศน์'
                        : session?.department?.includes('ฝางเทิง')
                        ? 'ศพด.บ้านฝางเทิง'
                        : 'สำนักปลัด')
                }
                setCurrentTab={setCurrentTab}
              />
            )}

            {(currentTab === 'internal-control' || currentTab === 'control-risk') && (
              <InternalControlView
                key={`internal-control-${selectedYear}`}
                selectedYear={selectedYear}
                internalControls={internalControls}
                setInternalControls={setInternalControls}
                orgProfile={orgProfile}
              />
            )}

            {currentTab === 'risk-management' && (
              <RiskManagementView
                key={`risk-management-${selectedYear}`}
                selectedYear={selectedYear}
                riskManagement={riskManagement}
                setRiskManagement={setRiskManagement}
                orgProfile={orgProfile}
                session={session}
              />
            )}

            {currentTab === 'lpa' && (
              <LpaView
                key={`lpa-${selectedYear}`}
                selectedYear={selectedYear}
                lpaIndicators={lpaIndicators}
                orgProfile={orgProfile}
              />
            )}

            {currentTab === 'knowledge' && (
              <KnowledgeView
                key={`knowledge-${selectedYear}`}
                selectedYear={selectedYear}
                knowledgeBase={knowledgeBase}
                onUpdateKnowledgeBase={setKnowledgeBase}
                orgProfile={orgProfile}
                session={session}
              />
            )}

            {currentTab === 'forms' && (
              <FormsView
                key={`forms-${selectedYear}`}
                setCurrentTab={setCurrentTab}
                selectedYear={selectedYear}
                formsBase={formsBase}
                onUpdateFormsBase={setFormsBase}
                orgProfile={orgProfile}
                session={session}
                riskManagement={riskManagement}
              />
            )}

            {(currentTab === 'backoffice' || currentTab === 'users') && session?.role === 'admin' && (
              <AdminBackofficeView
                key={`backoffice-${session?.username}`}
                currentSession={session}
                onSwitchToWorkbench={() => handleSelectTab('audit-risk')}
                onRefreshUser={() => {
                  setSession(getSession());
                  reloadDataFromStorage();
                }}
              />
            )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
