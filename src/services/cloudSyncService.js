import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

/**
 * Cloud Sync Service for IA-OS Fangkham
 * Handles two-way synchronization and real-time WebSocket subscriptions
 * with Supabase PostgreSQL for Risk Management, Internal Control, and Permissions.
 */

class CloudSyncService {
  constructor() {
    this.status = 'idle'; // 'idle' | 'connecting' | 'connected' | 'syncing' | 'error' | 'disconnected'
    this.lastSyncTime = null;
    this.lastError = null;
    this.statusListeners = new Set();
    this.realtimeChannel = null;
    this.isSubscribed = false;
    this.isPushing = false; // Flag to prevent infinite broadcast loops
  }

  // Notify all status listeners
  notifyStatus() {
    const state = this.getSyncStatus();
    this.statusListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in sync status listener:', err);
      }
    });
  }

  // Subscribe to status updates
  onSyncStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.getSyncStatus());
    return () => this.statusListeners.delete(callback);
  }

  // Current status summary
  getSyncStatus() {
    return {
      isConfigured: isSupabaseConfigured(),
      status: !isSupabaseConfigured() ? 'disconnected' : this.status,
      lastSyncTime: this.lastSyncTime,
      error: this.lastError
    };
  }

  /**
   * Initialize Realtime Subscription & Sync
   * @param {Object} options
   * @param {Function} options.onRiskManagementUpdate - Callback when risk data changes in cloud
   * @param {Function} options.onDepartmentPermissionsUpdate - Callback when permissions change
   * @param {Function} options.onPublicOverviewUpdate - Callback when public overview/slogan changes
   */
  async initRealtimeSync({ onRiskManagementUpdate, onDepartmentPermissionsUpdate, onPublicOverviewUpdate } = {}) {
    if (!isSupabaseConfigured()) {
      this.status = 'disconnected';
      this.notifyStatus();
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      this.status = 'error';
      this.lastError = 'ไม่สามารถสร้าง Supabase Client ได้';
      this.notifyStatus();
      return;
    }

    try {
      this.status = 'connecting';
      this.notifyStatus();

      // Clean up previous channel if any
      if (this.realtimeChannel) {
        try {
          await client.removeChannel(this.realtimeChannel);
        } catch (e) {
          console.warn('Channel cleanup warning:', e);
        }
      }

      // Create new Supabase Realtime channel
      this.realtimeChannel = client
        .channel('ia_realtime_sync_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'risk_management_data' },
          (payload) => {
            // Avoid reacting to own push
            if (this.isPushing) return;

            console.log('⚡ [Cloud Realtime] Received risk_management_data event:', payload.eventType, payload.new);
            this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
            this.notifyStatus();

            if (payload.new && (payload.new.department === 'public_overview' || payload.new.fiscal_year === 'global')) {
              window.dispatchEvent(new CustomEvent('ia-public-overview-updated', { detail: payload.new.data }));
              if (onPublicOverviewUpdate) {
                onPublicOverviewUpdate(payload.new.data);
              }
              return;
            }

            if (onRiskManagementUpdate && payload.new) {
              const row = payload.new;
              onRiskManagementUpdate({
                fiscalYear: row.fiscal_year,
                department: row.department,
                data: row.data,
                updatedAt: row.updated_at
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'department_permissions' },
          (payload) => {
            console.log('⚡ [Cloud Realtime] Received department_permissions event:', payload.new);
            this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
            this.notifyStatus();

            if (onDepartmentPermissionsUpdate && payload.new) {
              onDepartmentPermissionsUpdate({
                department: payload.new.department,
                permissions: payload.new.permissions
              });
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ [Cloud Realtime] Successfully subscribed to Supabase Realtime!');
            this.status = 'connected';
            this.isSubscribed = true;
            this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
            this.lastError = null;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [Cloud Realtime] Channel error:', err);
            this.status = 'error';
            this.lastError = err?.message || 'การเชื่อมต่อ Realtime WebSocket ขัดข้อง';
          } else if (status === 'TIMED_OUT') {
            this.status = 'error';
            this.lastError = 'การเชื่อมต่อ Realtime หมดเวลา';
          }
          this.notifyStatus();
        });
    } catch (err) {
      console.error('Failed to init Supabase Realtime sync:', err);
      this.status = 'error';
      this.lastError = err.message;
      this.notifyStatus();
    }
  }

  /**
   * Pull all risk management records from Supabase and assemble into year-based format
   */
  async pullAllRiskManagement() {
    if (!isSupabaseConfigured()) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      this.status = 'syncing';
      this.notifyStatus();

      const { data, error } = await client
        .from('risk_management_data')
        .select('*');

      if (error) {
        throw error;
      }

      this.status = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
      this.notifyStatus();

      if (!data || data.length === 0) return {};

      // Transform rows into year-based dictionary: { [year]: { bs1: [], bs2: [], submissions: {} } }
      const result = {};

      const dedupeList = (existing, incoming) => {
        const seen = new Set();
        const combined = [];
        [...(existing || []), ...(incoming || [])].forEach((item) => {
          if (!item) return;
          const key = item.id || (item.riskCode ? `${item.riskCode}-${item.department || ''}` : `${item.activity || ''}-${item.department || ''}`);
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        });
        return combined;
      };

      data.forEach((row) => {
        // Skip duplicate container row or public overview row if any exists
        if (
          row.department === 'หน่วยตรวจสอบภายใน' ||
          row.department === 'ส่วนกลาง' ||
          row.department === 'public_overview' ||
          row.fiscal_year === 'global'
        ) return;

        const yr = String(row.fiscal_year);
        if (!result[yr]) {
          result[yr] = {
            bs1: [],
            bs2: [],
            bs3: [],
            bs4: [],
            bs5: [],
            bs5Items: [],
            bs5Summary: {},
            submissions: {}
          };
        }

        const deptData = row.data || {};
        if (Array.isArray(deptData.bs1)) {
          result[yr].bs1 = dedupeList(result[yr].bs1, deptData.bs1);
        }
        if (Array.isArray(deptData.bs2)) {
          result[yr].bs2 = dedupeList(result[yr].bs2, deptData.bs2);
        }
        if (Array.isArray(deptData.bs3)) {
          result[yr].bs3 = dedupeList(result[yr].bs3, deptData.bs3);
        }
        if (Array.isArray(deptData.bs4)) {
          result[yr].bs4 = dedupeList(result[yr].bs4, deptData.bs4);
        }
        const incomingBs5 = Array.isArray(deptData.bs5)
          ? deptData.bs5
          : Array.isArray(deptData.bs5?.items)
          ? deptData.bs5.items
          : [];
        
        result[yr].bs5Items = dedupeList(result[yr].bs5Items, incomingBs5);
        result[yr].bs5 = dedupeList(result[yr].bs5, incomingBs5);

        if (deptData.bs5Summary && Object.keys(deptData.bs5Summary).length > 0) {
          result[yr].bs5Summary = { ...result[yr].bs5Summary, ...deptData.bs5Summary };
        }
        if (deptData.submissions && Object.keys(deptData.submissions).length > 0) {
          result[yr].submissions = { ...result[yr].submissions, ...deptData.submissions };
        }
      });

      return result;
    } catch (err) {
      console.error('Error pulling risk management from Supabase:', err);
      this.status = 'error';
      this.lastError = err.message;
      this.notifyStatus();
      throw err;
    }
  }

  /**
   * Push a single department's risk data to Cloud
   */
  async pushDeptRiskManagement(fiscalYear, department, deptPayload) {
    if (!isSupabaseConfigured() || !fiscalYear || !department) return false;
    const client = getSupabaseClient();
    if (!client) return false;

    this.isPushing = true;
    try {
      this.status = 'syncing';
      this.notifyStatus();

      const { error } = await client
        .from('risk_management_data')
        .upsert(
          {
            fiscal_year: String(fiscalYear),
            department: department,
            data: deptPayload,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'fiscal_year,department' }
        );

      if (error) throw error;

      this.status = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error(`Failed to push risk data for ${department} (${fiscalYear}):`, err);
      this.status = 'error';
      this.lastError = err.message;
      this.notifyStatus();
      return false;
    } finally {
      setTimeout(() => {
        this.isPushing = false;
      }, 500);
    }
  }

  /**
   * Push all local risk management data to Supabase (Initial Upload / Bulk Sync)
   */
  async pushAllRiskManagement(riskManagementByYear, departmentsList = []) {
    if (!isSupabaseConfigured()) throw new Error('ยังไม่ได้กำหนดค่า Supabase (URL / Key)');
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase Client ไม่พร้อมใช้งาน');

    this.isPushing = true;
    try {
      this.status = 'syncing';
      this.notifyStatus();

      const upsertRows = [];

      Object.entries(riskManagementByYear || {}).forEach(([year, yearData]) => {
        if (!yearData) return;

        // If departmentsList is empty, discover from items
        const allDepts = new Set(departmentsList);
        ['bs1', 'bs2', 'bs3', 'bs4', 'bs5'].forEach((key) => {
          (yearData[key] || []).forEach((item) => {
            if (item.department) allDepts.add(item.department);
          });
        });
        Object.keys(yearData.submissions || {}).forEach((d) => allDepts.add(d));

        allDepts.forEach((dept) => {
          const filterFn = (i) => i && i.department === dept;
          const bs5Items = Array.isArray(yearData.bs5)
            ? yearData.bs5
            : Array.isArray(yearData.bs5?.items)
            ? yearData.bs5.items
            : [];

          const deptPayload = {
            bs1: (Array.isArray(yearData.bs1) ? yearData.bs1 : []).filter(filterFn),
            bs2: (Array.isArray(yearData.bs2) ? yearData.bs2 : []).filter(filterFn),
            bs3: (Array.isArray(yearData.bs3) ? yearData.bs3 : []).filter(filterFn),
            bs4: (Array.isArray(yearData.bs4) ? yearData.bs4 : []).filter(filterFn),
            bs5: bs5Items.filter(filterFn),
            bs5Summary: yearData.bs5Summary || {},
            submissions: yearData.submissions?.[dept] ? { [dept]: yearData.submissions[dept] } : {}
          };

          upsertRows.push({
            fiscal_year: String(year),
            department: dept,
            data: deptPayload,
            updated_at: new Date().toISOString()
          });
        });
      });

      if (upsertRows.length === 0) {
        this.status = 'connected';
        this.notifyStatus();
        return { success: true, count: 0 };
      }

      const { data, error } = await client
        .from('risk_management_data')
        .upsert(upsertRows, { onConflict: 'fiscal_year,department' });

      if (error) throw error;

      this.status = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
      this.lastError = null;
      this.notifyStatus();
      return { success: true, count: upsertRows.length };
    } catch (err) {
      console.error('Failed to push all risk management data to Supabase:', err);
      this.status = 'error';
      this.lastError = err.message;
      this.notifyStatus();
      throw err;
    } finally {
      setTimeout(() => {
        this.isPushing = false;
      }, 500);
    }
  }

  /**
   * Pull department permissions from Cloud
   */
  async pullDepartmentPermissions() {
    if (!isSupabaseConfigured()) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('department_permissions')
        .select('*');

      if (error) throw error;
      if (!data) return {};

      const map = {};
      data.forEach((row) => {
        if (row.department) {
          map[row.department] = row.permissions || [];
        }
      });
      return map;
    } catch (err) {
      console.warn('Failed to pull department permissions from Supabase:', err);
      return null;
    }
  }

  /**
   * Push department permissions to Cloud
   */
  async pushDepartmentPermissions(department, permissions) {
    if (!isSupabaseConfigured() || !department) return false;
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('department_permissions')
        .upsert(
          {
            department,
            permissions: permissions || [],
            updated_at: new Date().toISOString()
          },
          { onConflict: 'department' }
        );

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn(`Failed to push permissions for ${department}:`, err);
      return false;
    }
  }

  /**
   * Pull public overview data (slogan, orbital nodes, metrics) from Cloud
   */
  async pullPublicOverviewData() {
    if (!isSupabaseConfigured()) return null;
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('risk_management_data')
        .select('data')
        .eq('fiscal_year', 'global')
        .eq('department', 'public_overview')
        .maybeSingle();

      if (error) throw error;
      return data?.data || null;
    } catch (err) {
      console.warn('Failed to pull public overview from Supabase:', err);
      return null;
    }
  }

  /**
   * Push public overview data (slogan, orbital nodes, metrics) to Cloud
   */
  async pushPublicOverviewData(overviewData) {
    if (!isSupabaseConfigured() || !overviewData) return false;
    const client = getSupabaseClient();
    if (!client) return false;

    this.isPushing = true;
    try {
      this.status = 'syncing';
      this.notifyStatus();

      const { error } = await client
        .from('risk_management_data')
        .upsert(
          {
            fiscal_year: 'global',
            department: 'public_overview',
            data: overviewData,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'fiscal_year,department' }
        );

      if (error) throw error;

      this.status = 'connected';
      this.lastSyncTime = new Date().toLocaleTimeString('th-TH');
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Failed to push public overview to Supabase:', err);
      this.status = 'error';
      this.lastError = err.message;
      this.notifyStatus();
      return false;
    } finally {
      setTimeout(() => {
        this.isPushing = false;
      }, 500);
    }
  }
}

/**
 * Helper to merge incoming cloud risk data into local year-based data
 */
export function mergeRiskManagement(localYearData, cloudYearData, activeUserDept = null) {
  if (!cloudYearData) return localYearData;
  if (!localYearData) return cloudYearData;

  const result = { ...localYearData };

  const dedupeByItem = (list) => {
    const seen = new Set();
    const clean = [];
    (list || []).forEach((item) => {
      if (!item) return;
      const key = item.id || (item.riskCode ? `${item.riskCode}-${item.department || ''}` : `${item.activity || ''}-${item.department || ''}`);
      if (!seen.has(key)) {
        seen.add(key);
        clean.push(item);
      }
    });
    return clean;
  };

  // Protect local departments that have been submitted locally or belong to current user
  const protectedDepts = new Set();
  if (activeUserDept && activeUserDept !== 'หน่วยตรวจสอบภายใน' && activeUserDept !== 'ส่วนกลาง') {
    protectedDepts.add(activeUserDept);
  }
  Object.entries(localYearData.submissions || {}).forEach(([dept, sub]) => {
    if (sub && (sub.status === 'submitted' || sub.status === 'reviewed')) {
      const cloudSub = cloudYearData.submissions?.[dept];
      if (!cloudSub || cloudSub.status !== 'submitted') {
        protectedDepts.add(dept);
      }
    }
  });

  // 1. Merge array-based tables: bs1, bs2, bs3, bs4
  ['bs1', 'bs2', 'bs3', 'bs4'].forEach((key) => {
    const localList = Array.isArray(result[key]) ? result[key] : [];
    const cloudList = Array.isArray(cloudYearData[key]) ? cloudYearData[key] : [];

    // Track departments that have items in the incoming cloud data
    const cloudDeptsWithItems = new Set();
    cloudList.forEach((item) => {
      if (item && item.department) cloudDeptsWithItems.add(item.department);
    });

    if (cloudDeptsWithItems.size > 0) {
      const keepLocal = localList.filter((item) => !cloudDeptsWithItems.has(item.department) || protectedDepts.has(item.department));
      const keepCloud = cloudList.filter((item) => !protectedDepts.has(item.department));
      result[key] = dedupeByItem([...keepLocal, ...keepCloud]);
    } else {
      result[key] = dedupeByItem(localList);
    }
  });

  // 2. Merge bs5 (which is an object with items: [...])
  const localBs5 = result.bs5 && typeof result.bs5 === 'object' && !Array.isArray(result.bs5)
    ? { ...result.bs5 }
    : {
        period: 'รอบ 12 เดือน',
        evaluator: 'คณะทำงานบริหารจัดการความเสี่ยง อปท.',
        evaluationDate: '',
        items: Array.isArray(result.bs5) ? result.bs5 : []
      };

  const localBs5Items = Array.isArray(localBs5.items) ? localBs5.items : [];
  const cloudBs5Items = Array.isArray(cloudYearData.bs5)
    ? cloudYearData.bs5
    : Array.isArray(cloudYearData.bs5?.items)
    ? cloudYearData.bs5.items
    : Array.isArray(cloudYearData.bs5Items)
    ? cloudYearData.bs5Items
    : [];

  const cloudBs5Depts = new Set();
  cloudBs5Items.forEach((item) => {
    if (item && item.department) cloudBs5Depts.add(item.department);
  });

  if (cloudBs5Depts.size > 0) {
    const keepBs5Items = localBs5Items.filter((item) => !cloudBs5Depts.has(item.department) || protectedDepts.has(item.department));
    const keepCloudBs5 = cloudBs5Items.filter((item) => !protectedDepts.has(item.department));
    localBs5.items = dedupeByItem([...keepBs5Items, ...keepCloudBs5]);
  } else {
    localBs5.items = dedupeByItem(localBs5Items);
  }

  // Preserve summary/metadata if provided from cloud
  if (cloudYearData.bs5 && typeof cloudYearData.bs5 === 'object' && !Array.isArray(cloudYearData.bs5)) {
    if (cloudYearData.bs5.summary) localBs5.summary = cloudYearData.bs5.summary;
    if (cloudYearData.bs5.approvedBy) localBs5.approvedBy = cloudYearData.bs5.approvedBy;
    if (cloudYearData.bs5.approverPosition) localBs5.approverPosition = cloudYearData.bs5.approverPosition;
    if (cloudYearData.bs5.reportDate) localBs5.reportDate = cloudYearData.bs5.reportDate;
  }

  result.bs5 = localBs5;

  // 3. Smart Merge for submissions:
  // Status hierarchy: 'reviewed' (สอบทานแล้ว) > 'submitted' (ส่งแล้ว) > 'draft' (ร่าง)
  const mergedSubmissions = {};
  const allSubDepts = new Set([
    ...Object.keys(result.submissions || {}),
    ...Object.keys(cloudYearData.submissions || {})
  ]);

  allSubDepts.forEach((dept) => {
    const localSub = result.submissions?.[dept];
    const cloudSub = cloudYearData.submissions?.[dept];

    if (localSub && !cloudSub) {
      mergedSubmissions[dept] = localSub;
    } else if (!localSub && cloudSub) {
      mergedSubmissions[dept] = cloudSub;
    } else if (localSub && cloudSub) {
      if (localSub.status === 'reviewed' && cloudSub.status !== 'reviewed') {
        mergedSubmissions[dept] = { ...cloudSub, ...localSub, status: 'reviewed', reviewStatus: 'reviewed' };
      } else if (cloudSub.status === 'reviewed' && localSub.status !== 'reviewed') {
        mergedSubmissions[dept] = { ...localSub, ...cloudSub, status: 'reviewed', reviewStatus: 'reviewed' };
      } else {
        mergedSubmissions[dept] = { ...cloudSub, ...localSub };
      }
    }
  });

  result.submissions = mergedSubmissions;
  result.bs5Summary = { ...(result.bs5Summary || {}), ...(cloudYearData.bs5Summary || {}) };

  return result;
}

export const cloudSyncService = new CloudSyncService();
export default cloudSyncService;
