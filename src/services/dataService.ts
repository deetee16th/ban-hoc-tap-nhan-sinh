import {
  SEED_ACCOUNTS,
  SEED_GROUP_NOTES,
  SEED_LOGS,
  SEED_MEMBERS,
  SEED_WEEKS,
} from '../data/seedData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  AccountRole,
  AttendanceStatus,
  CameraStatus,
  DailyLog,
  DEFAULT_UI_SETTINGS,
  getGroupPresentationNoteKey,
  GroupId,
  GroupPresentationNoteMap,
  HomeworkStatus,
  Member,
  MemberRole,
  MemberStatus,
  UiSettings,
  UserAccount,
  WeekConfig,
} from '../types';

export type DataSourceMode = 'supabase' | 'local';

export interface LearningDataset {
  members: Member[];
  weeks: WeekConfig[];
  logs: DailyLog[];
  accounts: UserAccount[];
  uiSettings: UiSettings;
  groupNotes: GroupPresentationNoteMap;
}

export interface ILearningDataService {
  isRemoteEnabled(): boolean;
  loadAll(): LearningDataset;
  syncFromRemote(): Promise<LearningDataset | null>;
  subscribeToRealtime(onUpdate: (dataset: LearningDataset) => void): () => void;
  getMembers(): Member[];
  saveMember(member: Member): Member[];
  deleteMember(memberId: string): LearningDataset;
  getWeeks(): WeekConfig[];
  saveWeek(week: WeekConfig): WeekConfig[];
  getLogs(): DailyLog[];
  upsertLog(log: DailyLog): DailyLog[];
  upsertLogsBatch(logsToUpsert: DailyLog[]): DailyLog[];
  getAccounts(): UserAccount[];
  authenticate(username: string, password: string): UserAccount | null;
  updateAccountPassword(accountId: string, newPassword: string): UserAccount[];
  getLoggedInAccountId(): string | null;
  setLoggedInAccountId(accountId: string | null): void;
  getUiSettings(): UiSettings;
  saveUiSettings(settings: UiSettings): UiSettings;
  getGroupNotes(): GroupPresentationNoteMap;
  saveGroupNote(
    weekNumber: number,
    group: GroupId,
    note: string
  ): GroupPresentationNoteMap;
  resetToSeedData(): LearningDataset;
}

const STORAGE_KEYS = {
  MEMBERS: 'nslt_v4_members',
  WEEKS: 'nslt_v4_weeks',
  LOGS: 'nslt_v4_logs',
  ACCOUNTS: 'nslt_v4_accounts',
  AUTH_ACCOUNT_ID: 'nslt_v4_auth_account_id',
  UI_SETTINGS: 'nslt_v4_ui_settings',
  GROUP_NOTES: 'nslt_v4_group_notes',
} as const;

interface MemberRow {
  id: string;
  stt: number;
  full_name: string;
  group_code: string;
  role: string;
  status: string;
  joined_date: string;
  inactive_date: string | null;
}

interface WeekRow {
  week_number: number;
  label: string;
  topic: string;
  start_date: string;
  end_date: string;
  study_dates: string[];
}

interface DailyLogRow {
  id: string;
  log_date: string;
  week_number: number;
  member_id: string;
  attendance: string;
  homework: string;
  camera: string;
  morning_note: string;
  homework_feedback: string;
  general_note: string;
}

interface AppSettingsRow {
  id: string;
  app_name: string;
  app_subtitle: string;
  group_names: Record<GroupId, string>;
  show_group_summary: boolean;
  show_percentage: boolean;
  allow_group_officer_view_other_groups: boolean;
}

interface GroupNoteRow {
  week_number: number;
  group_code: string;
  content: string;
}

interface AccountRow {
  id: string;
  username: string;
  password: string;
  display_name: string;
  role: string;
  assigned_group: string | null;
}

function cloneSeedMembers(): Member[] {
  return SEED_MEMBERS.map((m) => ({ ...m }));
}

function cloneSeedWeeks(): WeekConfig[] {
  return SEED_WEEKS.map((w) => ({
    ...w,
    studyDates: [...w.studyDates],
  }));
}

function cloneSeedLogs(): DailyLog[] {
  return SEED_LOGS.map((l) => ({ ...l }));
}

function cloneSeedAccounts(): UserAccount[] {
  return SEED_ACCOUNTS.map((a) => ({ ...a }));
}

function cloneDefaultUiSettings(): UiSettings {
  return {
    ...DEFAULT_UI_SETTINGS,
    groupNames: { ...DEFAULT_UI_SETTINGS.groupNames },
  };
}

function cloneSeedGroupNotes(): GroupPresentationNoteMap {
  return { ...SEED_GROUP_NOTES };
}

function readStorageArray<T>(key: string, fallbackFactory: () => T[]): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const initial = fallbackFactory();
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      const initial = fallbackFactory();
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return parsed as T[];
  } catch {
    const initial = fallbackFactory();
    try {
      window.localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      // Ignore storage quota errors
    }
    return initial;
  }
}

function writeStorageValue<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Không thể lưu dữ liệu vào localStorage (${key}):`, error);
  }
}

function normalizeMemberOrder(members: Member[]): Member[] {
  return [...members].sort((a, b) => a.stt - b.stt);
}

function normalizeWeekOrder(weeks: WeekConfig[]): WeekConfig[] {
  return [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
}

function sanitizeUiSettings(
  raw: Partial<UiSettings> | null | undefined
): UiSettings {
  const defaults = cloneDefaultUiSettings();
  if (!raw || typeof raw !== 'object') return defaults;

  return {
    appName:
      typeof raw.appName === 'string' && raw.appName.trim().length > 0
        ? raw.appName.trim()
        : defaults.appName,
    appSubtitle:
      typeof raw.appSubtitle === 'string'
        ? raw.appSubtitle.trim()
        : defaults.appSubtitle,
    groupNames: {
      G1: raw.groupNames?.G1?.trim() || defaults.groupNames.G1,
      G2: raw.groupNames?.G2?.trim() || defaults.groupNames.G2,
      G3: raw.groupNames?.G3?.trim() || defaults.groupNames.G3,
      G4: raw.groupNames?.G4?.trim() || defaults.groupNames.G4,
    },
    showGroupSummary:
      typeof raw.showGroupSummary === 'boolean'
        ? raw.showGroupSummary
        : defaults.showGroupSummary,
    showPercentage:
      typeof raw.showPercentage === 'boolean'
        ? raw.showPercentage
        : defaults.showPercentage,
    allowGroupOfficerViewOtherGroups:
      typeof raw.allowGroupOfficerViewOtherGroups === 'boolean'
        ? raw.allowGroupOfficerViewOtherGroups
        : defaults.allowGroupOfficerViewOtherGroups,
  };
}

// ============================================================================
// Chuyển đổi dữ liệu giữa Supabase Rows (snake_case) và App Types (camelCase)
// ============================================================================

function mapRowToMember(row: MemberRow): Member {
  return {
    id: row.id,
    stt: Number(row.stt),
    fullName: row.full_name,
    group: row.group_code as GroupId,
    role: row.role as MemberRole,
    status: (row.status as MemberStatus) || 'active',
    joinedDate: String(row.joined_date).slice(0, 10),
    inactiveDate: row.inactive_date
      ? String(row.inactive_date).slice(0, 10)
      : undefined,
  };
}

function mapMemberToRow(member: Member): MemberRow {
  return {
    id: member.id,
    stt: member.stt,
    full_name: member.fullName,
    group_code: member.group,
    role: member.role,
    status: member.status,
    joined_date: member.joinedDate,
    inactive_date:
      member.status === 'inactive' && member.inactiveDate
        ? member.inactiveDate
        : null,
  };
}

function mapRowToWeek(row: WeekRow): WeekConfig {
  const dates = Array.isArray(row.study_dates)
    ? row.study_dates.map((d) => String(d).slice(0, 10)).sort()
    : [];
  return {
    weekNumber: Number(row.week_number),
    label: row.label,
    topic: row.topic ?? '',
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    studyDates: dates,
  };
}

function mapWeekToRow(week: WeekConfig): WeekRow {
  return {
    week_number: week.weekNumber,
    label: week.label,
    topic: week.topic,
    start_date: week.startDate,
    end_date: week.endDate,
    study_dates: [...new Set(week.studyDates)].sort(),
  };
}

function mapRowToLog(row: DailyLogRow): DailyLog {
  const dateStr = String(row.log_date).slice(0, 10);
  return {
    id: row.id || `log-${dateStr}-${row.member_id}`,
    date: dateStr,
    weekNumber: Number(row.week_number),
    memberId: row.member_id,
    attendance: (row.attendance as AttendanceStatus) || 'Chưa chấm',
    homework: (row.homework as HomeworkStatus) || 'Chưa chấm',
    camera: (row.camera as CameraStatus) || 'Chưa chấm',
    morningNote: row.morning_note ?? '',
    homeworkFeedback: row.homework_feedback ?? '',
    generalNote: row.general_note ?? '',
  };
}

function mapLogToRow(log: DailyLog): DailyLogRow {
  return {
    id: log.id || `log-${log.date}-${log.memberId}`,
    log_date: log.date,
    week_number: log.weekNumber,
    member_id: log.memberId,
    attendance: log.attendance,
    homework: log.homework,
    camera: log.camera,
    morning_note: log.morningNote ?? '',
    homework_feedback: log.homeworkFeedback ?? '',
    general_note: log.generalNote ?? '',
  };
}

function mapRowToUiSettings(row: AppSettingsRow | null): UiSettings {
  if (!row) return cloneDefaultUiSettings();
  return sanitizeUiSettings({
    appName: row.app_name,
    appSubtitle: row.app_subtitle,
    groupNames: row.group_names,
    showGroupSummary: row.show_group_summary,
    showPercentage: row.show_percentage,
    allowGroupOfficerViewOtherGroups: row.allow_group_officer_view_other_groups,
  });
}

function mapUiSettingsToRow(settings: UiSettings): AppSettingsRow {
  const clean = sanitizeUiSettings(settings);
  return {
    id: 'default',
    app_name: clean.appName,
    app_subtitle: clean.appSubtitle,
    group_names: clean.groupNames,
    show_group_summary: clean.showGroupSummary,
    show_percentage: clean.showPercentage,
    allow_group_officer_view_other_groups:
      clean.allowGroupOfficerViewOtherGroups,
  };
}

function mapRowToAccount(row: AccountRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    displayName: row.display_name,
    role: row.role as AccountRole,
    assignedGroup: (row.assigned_group as GroupId) || null,
  };
}

function mapAccountToRow(account: UserAccount): AccountRow {
  return {
    id: account.id,
    username: account.username,
    password: account.password,
    display_name: account.displayName,
    role: account.role,
    assigned_group: account.assignedGroup,
  };
}

/**
 * Triển khai Hybrid DataService:
 * - Khi có cấu hình VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY: đọc/ghi trực tiếp
 *   với Supabase PostgreSQL và lắng nghe đồng bộ thời gian thực (Realtime).
 * - Khi chưa cấu hình biến môi trường (hoặc mất kết nối mạng): tự động fallback về
 *   localStorage, đảm bảo không bao giờ xảy ra lỗi màn hình trắng.
 */
export class HybridLearningDataService implements ILearningDataService {
  isRemoteEnabled(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  loadAll(): LearningDataset {
    return {
      members: this.getMembers(),
      weeks: this.getWeeks(),
      logs: this.getLogs(),
      accounts: this.getAccounts(),
      uiSettings: this.getUiSettings(),
      groupNotes: this.getGroupNotes(),
    };
  }

  async syncFromRemote(): Promise<LearningDataset | null> {
    if (!supabase) return null;

    try {
      const [
        membersRes,
        weeksRes,
        logsRes,
        settingsRes,
        notesRes,
        accountsRes,
      ] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .order('stt', { ascending: true }),
        supabase
          .from('weeks')
          .select('*')
          .order('week_number', { ascending: true }),
        supabase.from('daily_logs').select('*'),
        supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'default')
          .maybeSingle(),
        supabase.from('group_notes').select('*'),
        supabase.from('accounts').select('*'),
      ]);

      if (membersRes.error || weeksRes.error || logsRes.error) {
        console.warn(
          '[Supabase] Không thể tải dữ liệu từ Supabase, đang dùng dữ liệu localStorage:',
          membersRes.error || weeksRes.error || logsRes.error
        );
        return null;
      }

      const remoteMembers = ((membersRes.data ?? []) as MemberRow[]).map(
        mapRowToMember
      );
      const remoteWeeks = ((weeksRes.data ?? []) as WeekRow[]).map(
        mapRowToWeek
      );

      // Nếu database trên Supabase vừa mới tạo bảng nhưng chưa có dữ liệu, tự động nạp Seed Data
      if (remoteMembers.length === 0 && remoteWeeks.length === 0) {
        await this.pushSeedDataToRemote();
        return this.loadAll();
      }

      const members =
        remoteMembers.length > 0
          ? normalizeMemberOrder(remoteMembers)
          : this.getMembers();
      const weeks =
        remoteWeeks.length > 0
          ? normalizeWeekOrder(remoteWeeks)
          : this.getWeeks();
      const logs = ((logsRes.data ?? []) as DailyLogRow[]).map(mapRowToLog);

      const uiSettings =
        !settingsRes.error && settingsRes.data
          ? mapRowToUiSettings(settingsRes.data as AppSettingsRow)
          : this.getUiSettings();

      const groupNotes: GroupPresentationNoteMap = {};
      if (!notesRes.error && Array.isArray(notesRes.data)) {
        for (const row of notesRes.data as GroupNoteRow[]) {
          const key = getGroupPresentationNoteKey(
            Number(row.week_number),
            row.group_code as GroupId
          );
          groupNotes[key] = row.content ?? '';
        }
      } else {
        Object.assign(groupNotes, this.getGroupNotes());
      }

      let accounts = this.getAccounts();
      if (
        !accountsRes.error &&
        Array.isArray(accountsRes.data) &&
        accountsRes.data.length > 0
      ) {
        accounts = (accountsRes.data as AccountRow[]).map(mapRowToAccount);
      }

      // Cập nhật cache localStorage để lần mở app tiếp theo hiển thị tức thì
      writeStorageValue(STORAGE_KEYS.MEMBERS, members);
      writeStorageValue(STORAGE_KEYS.WEEKS, weeks);
      writeStorageValue(STORAGE_KEYS.LOGS, logs);
      writeStorageValue(STORAGE_KEYS.UI_SETTINGS, uiSettings);
      writeStorageValue(STORAGE_KEYS.GROUP_NOTES, groupNotes);
      writeStorageValue(STORAGE_KEYS.ACCOUNTS, accounts);

      return {
        members,
        weeks,
        logs,
        accounts,
        uiSettings,
        groupNotes,
      };
    } catch (error) {
      console.warn(
        '[Supabase] Lỗi kết nối Supabase, tự động fallback về localStorage:',
        error
      );
      return null;
    }
  }

  subscribeToRealtime(
    onUpdate: (dataset: LearningDataset) => void
  ): () => void {
    let debounceTimer: number | null = null;

    const triggerRefresh = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(async () => {
        if (supabase) {
          const remote = await this.syncFromRemote();
          if (remote) {
            onUpdate(remote);
          }
        } else {
          onUpdate(this.loadAll());
        }
      }, 280);
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('nslt_v4_')) {
        onUpdate(this.loadAll());
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    if (!supabase) {
      return () => {
        if (debounceTimer) window.clearTimeout(debounceTimer);
        window.removeEventListener('storage', handleStorageEvent);
      };
    }

    const client = supabase;
    const channel = client
      .channel('nhan-sinh-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        triggerRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weeks' },
        triggerRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_logs' },
        triggerRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        triggerRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_notes' },
        triggerRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        triggerRefresh
      )
      .subscribe();

    const handleWindowFocus = () => {
      triggerRefresh();
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleWindowFocus);

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleWindowFocus);
      void client.removeChannel(channel);
    };
  }

  private async pushSeedDataToRemote(): Promise<void> {
    if (!supabase) return;
    try {
      const members = cloneSeedMembers();
      const weeks = cloneSeedWeeks();
      const logs = cloneSeedLogs();
      const accounts = cloneSeedAccounts();
      const uiSettings = cloneDefaultUiSettings();
      const groupNotes = cloneSeedGroupNotes();

      await supabase
        .from('members')
        .upsert(members.map(mapMemberToRow), { onConflict: 'id' });
      await supabase
        .from('weeks')
        .upsert(weeks.map(mapWeekToRow), { onConflict: 'week_number' });
      await supabase
        .from('app_settings')
        .upsert([mapUiSettingsToRow(uiSettings)], { onConflict: 'id' });
      await supabase
        .from('accounts')
        .upsert(accounts.map(mapAccountToRow), { onConflict: 'id' });

      const noteRows: GroupNoteRow[] = Object.entries(groupNotes).map(
        ([key, content]) => {
          const [weekStr, groupCode] = key.split('::');
          return {
            week_number: Number(weekStr),
            group_code: groupCode,
            content,
          };
        }
      );
      if (noteRows.length > 0) {
        await supabase
          .from('group_notes')
          .upsert(noteRows, { onConflict: 'week_number,group_code' });
      }

      if (logs.length > 0) {
        await supabase
          .from('daily_logs')
          .upsert(logs.map(mapLogToRow), { onConflict: 'log_date,member_id' });
      }
    } catch (error) {
      console.warn('[Supabase] Không thể khởi tạo Seed Data từ client:', error);
    }
  }

  getMembers(): Member[] {
    const members = readStorageArray<Member>(
      STORAGE_KEYS.MEMBERS,
      cloneSeedMembers
    );
    return normalizeMemberOrder(members);
  }

  saveMember(member: Member): Member[] {
    const current = this.getMembers();
    const existsIndex = current.findIndex((m) => m.id === member.id);
    let next: Member[];

    if (existsIndex >= 0) {
      next = current.map((m) => (m.id === member.id ? { ...member } : m));
    } else {
      next = [...current, { ...member }];
    }

    const sorted = normalizeMemberOrder(next);
    writeStorageValue(STORAGE_KEYS.MEMBERS, sorted);

    if (supabase) {
      void supabase
        .from('members')
        .upsert([mapMemberToRow(member)], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi lưu thành viên:', error.message);
          }
        });
    }

    return sorted;
  }

  deleteMember(memberId: string): LearningDataset {
    const nextMembers = this.getMembers().filter((m) => m.id !== memberId);
    const nextLogs = this.getLogs().filter((l) => l.memberId !== memberId);
    const weeks = this.getWeeks();
    const accounts = this.getAccounts();
    const uiSettings = this.getUiSettings();
    const groupNotes = this.getGroupNotes();

    writeStorageValue(STORAGE_KEYS.MEMBERS, nextMembers);
    writeStorageValue(STORAGE_KEYS.LOGS, nextLogs);

    if (supabase) {
      void supabase
        .from('members')
        .delete()
        .eq('id', memberId)
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi xóa thành viên:', error.message);
          }
        });
    }

    return {
      members: nextMembers,
      weeks,
      logs: nextLogs,
      accounts,
      uiSettings,
      groupNotes,
    };
  }

  getWeeks(): WeekConfig[] {
    const weeks = readStorageArray<WeekConfig>(
      STORAGE_KEYS.WEEKS,
      cloneSeedWeeks
    );
    return normalizeWeekOrder(weeks);
  }

  saveWeek(week: WeekConfig): WeekConfig[] {
    const current = this.getWeeks();
    const sortedDates = [...new Set(week.studyDates)].sort((a, b) =>
      a.localeCompare(b)
    );
    const normalized: WeekConfig = {
      ...week,
      studyDates: sortedDates,
    };
    const exists = current.some((w) => w.weekNumber === week.weekNumber);
    const next = exists
      ? current.map((w) =>
          w.weekNumber === week.weekNumber ? normalized : w
        )
      : [...current, normalized];

    const sorted = normalizeWeekOrder(next);
    writeStorageValue(STORAGE_KEYS.WEEKS, sorted);

    if (supabase) {
      void supabase
        .from('weeks')
        .upsert([mapWeekToRow(normalized)], { onConflict: 'week_number' })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi lưu tuần học:', error.message);
          }
        });
    }

    return sorted;
  }

  getLogs(): DailyLog[] {
    return readStorageArray<DailyLog>(STORAGE_KEYS.LOGS, cloneSeedLogs);
  }

  upsertLog(log: DailyLog): DailyLog[] {
    return this.upsertLogsBatch([log]);
  }

  upsertLogsBatch(logsToUpsert: DailyLog[]): DailyLog[] {
    const current = this.getLogs();
    const logMap = new Map<string, DailyLog>();

    for (const item of current) {
      logMap.set(`${item.date}::${item.memberId}`, item);
    }

    const normalizedBatch: DailyLog[] = [];

    for (const incoming of logsToUpsert) {
      const key = `${incoming.date}::${incoming.memberId}`;
      const normalizedId =
        incoming.id || `log-${incoming.date}-${incoming.memberId}`;
      const record: DailyLog = {
        ...incoming,
        id: normalizedId,
      };
      logMap.set(key, record);
      normalizedBatch.push(record);
    }

    const next = Array.from(logMap.values());
    writeStorageValue(STORAGE_KEYS.LOGS, next);

    if (supabase && normalizedBatch.length > 0) {
      void supabase
        .from('daily_logs')
        .upsert(normalizedBatch.map(mapLogToRow), {
          onConflict: 'log_date,member_id',
        })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi lưu nhật ký điểm danh:', error.message);
          }
        });
    }

    return next;
  }

  getAccounts(): UserAccount[] {
    const stored = readStorageArray<UserAccount>(
      STORAGE_KEYS.ACCOUNTS,
      cloneSeedAccounts
    );
    if (stored.length === 0) {
      const initial = cloneSeedAccounts();
      writeStorageValue(STORAGE_KEYS.ACCOUNTS, initial);
      return initial;
    }
    return stored;
  }

  authenticate(username: string, password: string): UserAccount | null {
    const normalizedUsername = username.trim().toLowerCase();
    const accounts = this.getAccounts();
    const matched = accounts.find(
      (acc) =>
        acc.username.toLowerCase() === normalizedUsername &&
        acc.password === password
    );
    return matched ? { ...matched } : null;
  }

  updateAccountPassword(accountId: string, newPassword: string): UserAccount[] {
    const current = this.getAccounts();
    const next = current.map((acc) =>
      acc.id === accountId ? { ...acc, password: newPassword } : acc
    );
    writeStorageValue(STORAGE_KEYS.ACCOUNTS, next);

    const updatedAccount = next.find((a) => a.id === accountId);
    if (supabase && updatedAccount) {
      void supabase
        .from('accounts')
        .upsert([mapAccountToRow(updatedAccount)], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi cập nhật mật khẩu:', error.message);
          }
        });
    }

    return next;
  }

  getLoggedInAccountId(): string | null {
    try {
      const value = window.localStorage.getItem(STORAGE_KEYS.AUTH_ACCOUNT_ID);
      return value && value.trim().length > 0 ? value : null;
    } catch {
      return null;
    }
  }

  setLoggedInAccountId(accountId: string | null): void {
    try {
      if (accountId) {
        window.localStorage.setItem(STORAGE_KEYS.AUTH_ACCOUNT_ID, accountId);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.AUTH_ACCOUNT_ID);
      }
    } catch (error) {
      console.error('Không thể cập nhật phiên đăng nhập:', error);
    }
  }

  getUiSettings(): UiSettings {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.UI_SETTINGS);
      if (!raw) {
        const initial = cloneDefaultUiSettings();
        window.localStorage.setItem(
          STORAGE_KEYS.UI_SETTINGS,
          JSON.stringify(initial)
        );
        return initial;
      }
      const parsed = JSON.parse(raw) as Partial<UiSettings>;
      return sanitizeUiSettings(parsed);
    } catch {
      const initial = cloneDefaultUiSettings();
      writeStorageValue(STORAGE_KEYS.UI_SETTINGS, initial);
      return initial;
    }
  }

  saveUiSettings(settings: UiSettings): UiSettings {
    const clean = sanitizeUiSettings(settings);
    writeStorageValue(STORAGE_KEYS.UI_SETTINGS, clean);

    if (supabase) {
      void supabase
        .from('app_settings')
        .upsert([mapUiSettingsToRow(clean)], { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi lưu cấu hình giao diện:', error.message);
          }
        });
    }

    return clean;
  }

  getGroupNotes(): GroupPresentationNoteMap {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.GROUP_NOTES);
      if (!raw) {
        const initial = cloneSeedGroupNotes();
        window.localStorage.setItem(
          STORAGE_KEYS.GROUP_NOTES,
          JSON.stringify(initial)
        );
        return initial;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        const initial = cloneSeedGroupNotes();
        writeStorageValue(STORAGE_KEYS.GROUP_NOTES, initial);
        return initial;
      }
      return parsed as GroupPresentationNoteMap;
    } catch {
      const initial = cloneSeedGroupNotes();
      writeStorageValue(STORAGE_KEYS.GROUP_NOTES, initial);
      return initial;
    }
  }

  saveGroupNote(
    weekNumber: number,
    group: GroupId,
    note: string
  ): GroupPresentationNoteMap {
    const current = this.getGroupNotes();
    const key = getGroupPresentationNoteKey(weekNumber, group);
    const next: GroupPresentationNoteMap = {
      ...current,
      [key]: note,
    };
    writeStorageValue(STORAGE_KEYS.GROUP_NOTES, next);

    if (supabase) {
      void supabase
        .from('group_notes')
        .upsert(
          [
            {
              week_number: weekNumber,
              group_code: group,
              content: note,
            },
          ],
          { onConflict: 'week_number,group_code' }
        )
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase] Lỗi lưu ghi chú trình bày nhóm:', error.message);
          }
        });
    }

    return next;
  }

  resetToSeedData(): LearningDataset {
    const members = cloneSeedMembers();
    const weeks = cloneSeedWeeks();
    const logs = cloneSeedLogs();
    const accounts = cloneSeedAccounts();
    const uiSettings = cloneDefaultUiSettings();
    const groupNotes = cloneSeedGroupNotes();

    writeStorageValue(STORAGE_KEYS.MEMBERS, members);
    writeStorageValue(STORAGE_KEYS.WEEKS, weeks);
    writeStorageValue(STORAGE_KEYS.LOGS, logs);
    writeStorageValue(STORAGE_KEYS.ACCOUNTS, accounts);
    writeStorageValue(STORAGE_KEYS.UI_SETTINGS, uiSettings);
    writeStorageValue(STORAGE_KEYS.GROUP_NOTES, groupNotes);

    if (supabase) {
      void (async () => {
        try {
          await supabase.from('daily_logs').delete().neq('id', '');
          await supabase.from('group_notes').delete().neq('group_code', '');
          await supabase.from('members').delete().neq('id', '');
          await supabase.from('weeks').delete().gt('week_number', 0);
          await this.pushSeedDataToRemote();
        } catch (error) {
          console.warn('[Supabase] Lỗi khôi phục dữ liệu mẫu trên Supabase:', error);
        }
      })();
    }

    return { members, weeks, logs, accounts, uiSettings, groupNotes };
  }
}

export const dataService: ILearningDataService =
  new HybridLearningDataService();
