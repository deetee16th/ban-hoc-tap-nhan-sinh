import { DailyLog, GROUPS, GroupId, Member } from '../types';

export interface SlipsBreakdown {
  total: number;
  late: number;
  absent: number;
  absentExcused: number;
  homeworkMissed: number;
  cameraOff: number;
}

export interface GroupSummaryItem {
  group: GroupId;
  memberCount: number;
  onTimeMemberCount: number;
  onTimeMemberRate: number;
  cameraOnMemberCount: number;
  cameraOnMemberRate: number;
  homeworkOnTimeMemberCount: number;
  homeworkOnTimeMemberRate: number;
}

export interface MemberAttentionEntry {
  date: string;
  attendance: DailyLog['attendance'];
  camera: DailyLog['camera'];
  homework: DailyLog['homework'];
  morningNote: string;
  generalNote: string;
}

export interface MemberAttentionItem {
  member: Member;
  lateCount: number;
  absentCount: number;
  cameraOffCount: number;
  homeworkMissingCount: number;
  homeworkLateCount: number;
  totalIssues: number;
  latestNote: string;
  morningNotes: Array<{ date: string; text: string }>;
  entries: MemberAttentionEntry[];
}

export interface WeeklyDashboardStats {
  weekNumber: number;
  totalMembers: number;
  activeMembers: number;
  totalLogs: number;
  qualifiedCount: number;
  qualifiedRate: number;
  onTimeCount: number;
  attendanceGradedCount: number;
  onTimeRate: number;
  cameraOnCount: number;
  attendedCount: number;
  cameraRate: number;
  homeworkOnTimeCount: number;
  homeworkGradedCount: number;
  homeworkRate: number;
  slips: SlipsBreakdown;
  groupSummaries: GroupSummaryItem[];
  qualifiedByGroup: Record<GroupId, Member[]>;
  attentionList: MemberAttentionItem[];
}

export interface HighlightItem {
  log: DailyLog;
  member: Member;
}

export interface SupportLogEntry {
  date: string;
  attendance: DailyLog['attendance'];
  homework: DailyLog['homework'];
  camera: DailyLog['camera'];
  morningNote: string;
  generalNote: string;
}

export interface SupportNeededItem {
  member: Member;
  totalSlips: number;
  lateCount: number;
  absentCount: number;
  homeworkSlipCount: number;
  cameraOffCount: number;
  entries: SupportLogEntry[];
}

export interface WeeklyInsightsData {
  highlights: HighlightItem[];
  supportNeeded: SupportNeededItem[];
}

function parseIsoDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  return { year, month, day };
}

export function formatDateVN(dateStr: string): string {
  const parsed = parseIsoDateParts(dateStr);
  if (!parsed) return dateStr;
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}/${parsed.year}`;
}

export function formatShortDateVN(dateStr: string): string {
  const parsed = parseIsoDateParts(dateStr);
  if (!parsed) return dateStr;
  const dd = String(parsed.day).padStart(2, '0');
  const mm = String(parsed.month).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function getWeekdayVN(dateStr: string): string {
  const parsed = parseIsoDateParts(dateStr);
  if (!parsed) return '';
  const localDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  const dayIndex = localDate.getDay();
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return labels[dayIndex] ?? '';
}

export function isSundayIsoDate(dateStr: string): boolean {
  const parsed = parseIsoDateParts(dateStr);
  if (!parsed) return false;
  const localDate = new Date(parsed.year, parsed.month - 1, parsed.day);
  return localDate.getDay() === 0;
}

export function addDaysToIsoDate(dateStr: string, offsetDays: number): string {
  const parsed = parseIsoDateParts(dateStr);
  if (!parsed) return dateStr;
  const localDate = new Date(
    parsed.year,
    parsed.month - 1,
    parsed.day + offsetDays
  );
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, '0');
  const d = String(localDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function enumerateDatesInRange(
  startDate: string,
  endDate: string,
  maxDays = 45
): string[] {
  const start = parseIsoDateParts(startDate);
  const end = parseIsoDateParts(endDate);
  if (!start || !end) return [];
  if (startDate > endDate) return [];

  const result: string[] = [];
  let cursor = startDate;
  let guard = 0;

  while (cursor <= endDate && guard < maxDays) {
    result.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
    guard += 1;
  }

  return result;
}

// ================= Vòng đời học viên =================

export function isMemberNotJoinedYet(member: Member, date: string): boolean {
  return Boolean(member.joinedDate && date < member.joinedDate);
}

export function isMemberInactiveOnDate(member: Member, date: string): boolean {
  if (member.status !== 'inactive') return false;
  if (!member.inactiveDate) return true;
  return date >= member.inactiveDate;
}

export function isMemberEligibleOnDate(member: Member, date: string): boolean {
  return (
    !isMemberNotJoinedYet(member, date) && !isMemberInactiveOnDate(member, date)
  );
}

export function isMemberActiveInWeek(
  member: Member,
  studyDates: string[]
): boolean {
  if (studyDates.length === 0) {
    return member.status === 'active';
  }
  return studyDates.some((date) => isMemberEligibleOnDate(member, date));
}

// ================= Kiểm tra trạng thái bản ghi =================

export function isLogGraded(log: DailyLog): boolean {
  return (
    log.attendance !== 'Chưa chấm' ||
    log.camera !== 'Chưa chấm' ||
    log.homework !== 'Chưa chấm'
  );
}

export function isLogMorningPerfect(log: DailyLog): boolean {
  return log.attendance === 'Đúng giờ' && log.camera === 'Có';
}

export function isLogEveningPerfect(log: DailyLog): boolean {
  return log.homework === 'Đúng hạn';
}

export function isLogPerfect(log: DailyLog): boolean {
  if (!isLogGraded(log)) return false;
  const attendanceOk =
    log.attendance === 'Đúng giờ' || log.attendance === 'Chưa chấm';
  const cameraOk = log.camera === 'Có' || log.camera === 'Chưa chấm';
  const homeworkOk =
    log.homework === 'Đúng hạn' || log.homework === 'Chưa chấm';
  return attendanceOk && cameraOk && homeworkOk;
}

function filterWeekLogs(
  members: Member[],
  logs: DailyLog[],
  weekNumber: number,
  studyDates?: string[]
): DailyLog[] {
  const memberById = new Map<string, Member>(members.map((m) => [m.id, m]));
  const dateSet =
    studyDates && studyDates.length > 0 ? new Set(studyDates) : null;

  return logs.filter((log) => {
    const member = memberById.get(log.memberId);
    if (!member) return false;
    const matchesWeek = dateSet
      ? dateSet.has(log.date)
      : log.weekNumber === weekNumber;
    if (!matchesWeek) return false;
    if (!isMemberEligibleOnDate(member, log.date)) return false;
    return isLogGraded(log);
  });
}

export function computeWeeklyDashboard(
  members: Member[],
  logs: DailyLog[],
  weekNumber: number,
  studyDates?: string[]
): WeeklyDashboardStats {
  const weekLogs = filterWeekLogs(members, logs, weekNumber, studyDates);

  const logsByMember = new Map<string, DailyLog[]>();
  for (const log of weekLogs) {
    const list = logsByMember.get(log.memberId) ?? [];
    list.push(log);
    logsByMember.set(log.memberId, list);
  }

  // Chỉ tính các thành viên có ít nhất 1 ngày học thuộc diện hoạt động trong tuần này
  const effectiveMembers = members
    .filter((member) => {
      if (studyDates && studyDates.length > 0) {
        return isMemberActiveInWeek(member, studyDates);
      }
      return member.status === 'active' || logsByMember.has(member.id);
    })
    .sort((a, b) => a.stt - b.stt);

  const qualifiedMemberIds = new Set<string>();
  const attentionList: MemberAttentionItem[] = [];
  let activeMembers = 0;

  for (const member of effectiveMembers) {
    const memberLogs = (logsByMember.get(member.id) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    if (memberLogs.length === 0) continue;

    activeMembers += 1;
    if (memberLogs.every(isLogPerfect)) {
      qualifiedMemberIds.add(member.id);
    } else {
      let lateCount = 0;
      let absentCount = 0;
      let cameraOffCount = 0;
      let homeworkMissingCount = 0;
      let homeworkLateCount = 0;
      let latestNote = '';
      const morningNotes: Array<{ date: string; text: string }> = [];
      const entries: MemberAttentionEntry[] = [];

      for (const log of memberLogs) {
        let logHasIssue = false;

        if (log.attendance === 'Muộn') {
          lateCount += 1;
          logHasIssue = true;
        }
        if (log.attendance === 'Vắng' || log.attendance === 'Vắng CP') {
          absentCount += 1;
          logHasIssue = true;
        }
        if (
          (log.attendance === 'Đúng giờ' || log.attendance === 'Muộn') &&
          log.camera === 'Không'
        ) {
          cameraOffCount += 1;
          logHasIssue = true;
        }
        if (log.homework === 'Chưa nộp' || log.homework === 'Không nộp') {
          homeworkMissingCount += 1;
          logHasIssue = true;
        } else if (log.homework === 'Muộn' || log.homework === 'Muộn CP') {
          homeworkLateCount += 1;
          logHasIssue = true;
        }

        if (log.morningNote.trim().length > 0) {
          morningNotes.push({
            date: log.date,
            text: log.morningNote.trim(),
          });
        }

        if (logHasIssue) {
          entries.push({
            date: log.date,
            attendance: log.attendance,
            camera: log.camera,
            homework: log.homework,
            morningNote: log.morningNote.trim(),
            generalNote: log.generalNote.trim(),
          });
          if (!latestNote) {
            latestNote = log.morningNote.trim() || log.generalNote.trim();
          }
        }
      }

      const totalIssues =
        lateCount +
        absentCount +
        cameraOffCount +
        homeworkMissingCount +
        homeworkLateCount;

      if (totalIssues > 0) {
        attentionList.push({
          member,
          lateCount,
          absentCount,
          cameraOffCount,
          homeworkMissingCount,
          homeworkLateCount,
          totalIssues,
          latestNote,
          morningNotes,
          entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
        });
      }
    }
  }

  attentionList.sort((a, b) => {
    if (b.totalIssues !== a.totalIssues) return b.totalIssues - a.totalIssues;
    return a.member.stt - b.member.stt;
  });

  // KPI 1: Đạt chuẩn cả tuần
  const totalMembers = effectiveMembers.length;
  const qualifiedCount = qualifiedMemberIds.size;
  const qualifiedRate =
    totalMembers > 0 ? Math.round((qualifiedCount / totalMembers) * 100) : 0;

  // KPI 2: Vào lớp đúng giờ
  const attendanceGradedLogs = weekLogs.filter(
    (log) => log.attendance !== 'Chưa chấm'
  );
  const attendanceGradedCount = attendanceGradedLogs.length;
  const onTimeCount = attendanceGradedLogs.filter(
    (log) => log.attendance === 'Đúng giờ'
  ).length;
  const onTimeRate =
    attendanceGradedCount > 0
      ? Math.round((onTimeCount / attendanceGradedCount) * 100)
      : 0;

  // KPI 3: Bật camera
  const attendedCameraLogs = weekLogs.filter(
    (log) =>
      (log.attendance === 'Đúng giờ' || log.attendance === 'Muộn') &&
      log.camera !== 'Chưa chấm'
  );
  const attendedCount = attendedCameraLogs.length;
  const cameraOnCount = attendedCameraLogs.filter(
    (log) => log.camera === 'Có'
  ).length;
  const cameraRate =
    attendedCount > 0 ? Math.round((cameraOnCount / attendedCount) * 100) : 0;

  // KPI 4: Nộp bài tập
  const totalLogs = weekLogs.length;
  const homeworkGradedLogs = weekLogs.filter(
    (log) => log.homework !== 'Chưa chấm'
  );
  const homeworkGradedCount = homeworkGradedLogs.length;
  const homeworkOnTimeCount = homeworkGradedLogs.filter(
    (log) => log.homework === 'Đúng hạn'
  ).length;
  const homeworkRate =
    homeworkGradedCount > 0
      ? Math.round((homeworkOnTimeCount / homeworkGradedCount) * 100)
      : 0;

  // Chi tiết sơ suất (Quên bài chỉ đếm 'Chưa nộp' | 'Không nộp')
  const late = weekLogs.filter((log) => log.attendance === 'Muộn').length;
  const absentExcused = weekLogs.filter(
    (log) => log.attendance === 'Vắng CP'
  ).length;
  const absent = weekLogs.filter(
    (log) => log.attendance === 'Vắng' || log.attendance === 'Vắng CP'
  ).length;
  const homeworkMissed = weekLogs.filter(
    (log) => log.homework === 'Chưa nộp' || log.homework === 'Không nộp'
  ).length;
  const cameraOff = attendedCameraLogs.filter(
    (log) => log.camera === 'Không'
  ).length;

  const slips: SlipsBreakdown = {
    total: late + absent + homeworkMissed + cameraOff,
    late,
    absent,
    absentExcused,
    homeworkMissed,
    cameraOff,
  };

  // Tổng kết 4 nhóm cố định theo thứ tự Nhóm 1 -> Nhóm 4 (không xếp hạng)
  const groupSummaries: GroupSummaryItem[] = GROUPS.map((group) => {
    const groupMembers = effectiveMembers.filter((m) => m.group === group);
    const memberCount = groupMembers.length;

    let onTimeMemberCount = 0;
    let cameraOnMemberCount = 0;
    let homeworkOnTimeMemberCount = 0;

    for (const member of groupMembers) {
      const mLogs = logsByMember.get(member.id) ?? [];

      const attLogs = mLogs.filter((l) => l.attendance !== 'Chưa chấm');
      if (
        attLogs.length > 0 &&
        attLogs.every((l) => l.attendance === 'Đúng giờ')
      ) {
        onTimeMemberCount += 1;
      }

      const camLogs = mLogs.filter(
        (l) =>
          (l.attendance === 'Đúng giờ' || l.attendance === 'Muộn') &&
          l.camera !== 'Chưa chấm'
      );
      if (camLogs.length > 0 && camLogs.every((l) => l.camera === 'Có')) {
        cameraOnMemberCount += 1;
      }

      const hwLogs = mLogs.filter((l) => l.homework !== 'Chưa chấm');
      if (hwLogs.length > 0 && hwLogs.every((l) => l.homework === 'Đúng hạn')) {
        homeworkOnTimeMemberCount += 1;
      }
    }

    return {
      group,
      memberCount,
      onTimeMemberCount,
      onTimeMemberRate:
        memberCount > 0 ? Math.round((onTimeMemberCount / memberCount) * 100) : 0,
      cameraOnMemberCount,
      cameraOnMemberRate:
        memberCount > 0
          ? Math.round((cameraOnMemberCount / memberCount) * 100)
          : 0,
      homeworkOnTimeMemberCount,
      homeworkOnTimeMemberRate:
        memberCount > 0
          ? Math.round((homeworkOnTimeMemberCount / memberCount) * 100)
          : 0,
    };
  });

  const qualifiedByGroup: Record<GroupId, Member[]> = {
    G1: [],
    G2: [],
    G3: [],
    G4: [],
  };

  for (const group of GROUPS) {
    qualifiedByGroup[group] = effectiveMembers
      .filter((m) => m.group === group && qualifiedMemberIds.has(m.id))
      .sort((a, b) => a.stt - b.stt);
  }

  return {
    weekNumber,
    totalMembers,
    activeMembers,
    totalLogs,
    qualifiedCount,
    qualifiedRate,
    onTimeCount,
    attendanceGradedCount,
    onTimeRate,
    cameraOnCount,
    attendedCount,
    cameraRate,
    homeworkOnTimeCount,
    homeworkGradedCount,
    homeworkRate,
    slips,
    groupSummaries,
    qualifiedByGroup,
    attentionList,
  };
}

export function computeWeeklyInsights(
  members: Member[],
  logs: DailyLog[],
  weekNumber: number,
  studyDates?: string[]
): WeeklyInsightsData {
  const memberById = new Map<string, Member>(members.map((m) => [m.id, m]));
  const weekLogs = filterWeekLogs(members, logs, weekNumber, studyDates);

  // Góc Điểm Sáng: tự động lấy các bản ghi có ô "Nhận xét & Đánh giá bài (theo cảm xúc)"
  const highlights: HighlightItem[] = weekLogs
    .filter((log) => log.homeworkFeedback.trim().length > 0)
    .map((log) => ({
      log,
      member: memberById.get(log.memberId)!,
    }))
    .sort((a, b) => {
      const dateDiff = b.log.date.localeCompare(a.log.date);
      if (dateDiff !== 0) return dateDiff;
      return a.member.stt - b.member.stt;
    });

  // Góc Cần Trợ Lực: tổng lượt vắng/muộn/thiếu bài >= 2 trong tuần
  const logsByMember = new Map<string, DailyLog[]>();
  for (const log of weekLogs) {
    const list = logsByMember.get(log.memberId) ?? [];
    list.push(log);
    logsByMember.set(log.memberId, list);
  }

  const supportNeeded: SupportNeededItem[] = [];

  for (const member of members) {
    const mLogs = (logsByMember.get(member.id) ?? []).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    if (mLogs.length === 0) continue;

    let lateCount = 0;
    let absentCount = 0;
    let homeworkSlipCount = 0;
    let cameraOffCount = 0;
    const entries: SupportLogEntry[] = [];

    for (const log of mLogs) {
      let hasSlip = false;
      if (log.attendance === 'Muộn') {
        lateCount += 1;
        hasSlip = true;
      } else if (log.attendance === 'Vắng' || log.attendance === 'Vắng CP') {
        absentCount += 1;
        hasSlip = true;
      }

      if (log.homework !== 'Đúng hạn' && log.homework !== 'Chưa chấm') {
        homeworkSlipCount += 1;
        hasSlip = true;
      }

      if (
        (log.attendance === 'Đúng giờ' || log.attendance === 'Muộn') &&
        log.camera === 'Không'
      ) {
        cameraOffCount += 1;
      }

      if (hasSlip) {
        entries.push({
          date: log.date,
          attendance: log.attendance,
          homework: log.homework,
          camera: log.camera,
          morningNote: log.morningNote.trim(),
          generalNote: log.generalNote.trim(),
        });
      }
    }

    const totalSlips = lateCount + absentCount + homeworkSlipCount;
    if (totalSlips >= 2) {
      supportNeeded.push({
        member,
        totalSlips,
        lateCount,
        absentCount,
        homeworkSlipCount,
        cameraOffCount,
        entries,
      });
    }
  }

  supportNeeded.sort((a, b) => {
    if (b.totalSlips !== a.totalSlips) return b.totalSlips - a.totalSlips;
    return a.member.stt - b.member.stt;
  });

  return {
    highlights,
    supportNeeded,
  };
}
