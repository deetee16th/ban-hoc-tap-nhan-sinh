import * as XLSX from 'xlsx';
import {
  DailyLog,
  getGroupDisplayName,
  GROUPS,
  GroupId,
  Member,
  WeekConfig,
} from '../types';
import {
  formatDateVN,
  formatShortDateVN,
  isMemberActiveInWeek,
  isMemberEligibleOnDate,
  isMemberInactiveOnDate,
  isMemberNotJoinedYet,
} from './analytics';

export interface WeeklySummaryExportRow {
  STT: number;
  Nhóm: string;
  'Họ tên': string;
  'Trạng thái': string;
  'Đúng giờ': number;
  Muộn: number;
  Vắng: number;
  'Tắt cam': number;
  'Nộp bài đúng hạn': number;
  'Tổng lượt lưu ý': number;
  'Ghi chú': string;
}

const GROUP_SHEET_NAMES: Record<GroupId, string> = {
  G1: 'Nhom_1',
  G2: 'Nhom_2',
  G3: 'Nhom_3',
  G4: 'Nhom_4',
};

function getMemberLifecycleLabel(member: Member, week: WeekConfig): string {
  if (member.status === 'inactive') {
    return member.inactiveDate
      ? `Nghỉ từ ${formatShortDateVN(member.inactiveDate)}`
      : 'Không hoạt động';
  }
  const firstDay = week.studyDates[0];
  if (firstDay && member.joinedDate && member.joinedDate > firstDay) {
    return `Mới vào từ ${formatShortDateVN(member.joinedDate)}`;
  }
  return 'Đang hoạt động';
}

export function buildWeeklySummaryRows(
  week: WeekConfig,
  members: Member[],
  logs: DailyLog[],
  groupNames?: Record<GroupId, string>
): WeeklySummaryExportRow[] {
  const dateSet = new Set(week.studyDates);
  const weekLogs = logs.filter((l) => dateSet.has(l.date));
  const logsByMember = new Map<string, DailyLog[]>();

  for (const log of weekLogs) {
    const arr = logsByMember.get(log.memberId) ?? [];
    arr.push(log);
    logsByMember.set(log.memberId, arr);
  }

  const orderedMembers = [...members]
    .filter(
      (m) => isMemberActiveInWeek(m, week.studyDates) || logsByMember.has(m.id)
    )
    .sort((a, b) => a.stt - b.stt);

  return orderedMembers.map((member) => {
    const memberLogs = (logsByMember.get(member.id) ?? [])
      .filter((l) => isMemberEligibleOnDate(member, l.date))
      .sort((a, b) => a.date.localeCompare(b.date));

    let onTime = 0;
    let late = 0;
    let absent = 0;
    let cameraOff = 0;
    let homeworkOnTime = 0;
    let totalIssues = 0;
    const notes: string[] = [];

    for (const log of memberLogs) {
      if (log.attendance === 'Đúng giờ') onTime += 1;
      if (log.attendance === 'Muộn') {
        late += 1;
        totalIssues += 1;
      }
      if (log.attendance === 'Vắng' || log.attendance === 'Vắng CP') {
        absent += 1;
        totalIssues += 1;
      }
      if (
        (log.attendance === 'Đúng giờ' || log.attendance === 'Muộn') &&
        log.camera === 'Không'
      ) {
        cameraOff += 1;
        totalIssues += 1;
      }
      if (log.homework === 'Đúng hạn') {
        homeworkOnTime += 1;
      } else if (log.homework !== 'Chưa chấm') {
        totalIssues += 1;
      }

      if (log.morningNote.trim()) {
        notes.push(`[${formatShortDateVN(log.date)} Sáng] ${log.morningNote.trim()}`);
      }
      if (log.generalNote.trim()) {
        notes.push(`[${formatShortDateVN(log.date)}] ${log.generalNote.trim()}`);
      }
    }

    return {
      STT: member.stt,
      Nhóm: getGroupDisplayName(member.group, groupNames),
      'Họ tên': member.fullName,
      'Trạng thái': getMemberLifecycleLabel(member, week),
      'Đúng giờ': onTime,
      Muộn: late,
      Vắng: absent,
      'Tắt cam': cameraOff,
      'Nộp bài đúng hạn': homeworkOnTime,
      'Tổng lượt lưu ý': totalIssues,
      'Ghi chú': notes.join(' | '),
    };
  });
}

export function buildGroupDetailRows(
  week: WeekConfig,
  group: GroupId,
  members: Member[],
  logs: DailyLog[]
): Array<Record<string, string>> {
  const groupMembers = members
    .filter((m) => m.group === group)
    .sort((a, b) => a.stt - b.stt);
  const logByKey = new Map<string, DailyLog>(
    logs.map((l) => [`${l.date}::${l.memberId}`, l])
  );

  const rows: Array<Record<string, string>> = [];

  for (const date of week.studyDates) {
    for (const member of groupMembers) {
      const existing = logByKey.get(`${date}::${member.id}`);

      if (isMemberInactiveOnDate(member, date) && !existing) {
        continue;
      }

      if (isMemberNotJoinedYet(member, date)) {
        rows.push({
          Ngày: formatDateVN(date),
          'Họ tên': member.fullName,
          'Điểm danh': 'Chưa tham gia',
          'Ghi chú sáng': '',
          Camera: 'Chưa tham gia',
          'Bài tập': 'Chưa tham gia',
          'Nhận xét bài': '',
          'Ghi chú chung': `Tham gia từ ${formatDateVN(member.joinedDate)}`,
        });
        continue;
      }

      rows.push({
        Ngày: formatDateVN(date),
        'Họ tên': member.fullName,
        'Điểm danh': existing?.attendance ?? 'Chưa chấm',
        'Ghi chú sáng': existing?.morningNote ?? '',
        Camera: existing?.camera ?? 'Chưa chấm',
        'Bài tập': existing?.homework ?? 'Chưa chấm',
        'Nhận xét bài': existing?.homeworkFeedback ?? '',
        'Ghi chú chung': existing?.generalNote ?? '',
      });
    }
  }

  return rows;
}

export function buildWeekWorkbook(
  week: WeekConfig,
  members: Member[],
  logs: DailyLog[],
  groupNames?: Record<GroupId, string>
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Tong_hop_tuan
  const summaryRows = buildWeeklySummaryRows(week, members, logs, groupNames);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 24 },
    { wch: 18 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
    { wch: 15 },
    { wch: 44 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong_hop_tuan');

  // Sheet 2..5: Nhom_1 .. Nhom_4
  for (const groupId of GROUPS) {
    const groupRows = buildGroupDetailRows(week, groupId, members, logs);
    const groupSheet = XLSX.utils.json_to_sheet(
      groupRows.length > 0
        ? groupRows
        : [
            {
              Ngày: '',
              'Họ tên': '(Chưa có dữ liệu)',
              'Điểm danh': '',
              'Ghi chú sáng': '',
              Camera: '',
              'Bài tập': '',
              'Nhận xét bài': '',
              'Ghi chú chung': '',
            },
          ]
    );
    groupSheet['!cols'] = [
      { wch: 12 },
      { wch: 24 },
      { wch: 14 },
      { wch: 30 },
      { wch: 12 },
      { wch: 14 },
      { wch: 38 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      groupSheet,
      GROUP_SHEET_NAMES[groupId]
    );
  }

  return workbook;
}

export function exportWeekToExcel(
  week: WeekConfig,
  members: Member[],
  logs: DailyLog[],
  groupNames?: Record<GroupId, string>
): number {
  const workbook = buildWeekWorkbook(week, members, logs, groupNames);
  const filename = `lop-nhan-sinh-tuan-${week.weekNumber}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return buildWeeklySummaryRows(week, members, logs, groupNames).length;
}

function sanitizeTsvCell(value: string | number): string {
  return String(value ?? '')
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();
}

export function buildWeekSummaryTsv(
  week: WeekConfig,
  members: Member[],
  logs: DailyLog[],
  groupNames?: Record<GroupId, string>
): string {
  const rows = buildWeeklySummaryRows(week, members, logs, groupNames);
  const headers: Array<keyof WeeklySummaryExportRow> = [
    'STT',
    'Nhóm',
    'Họ tên',
    'Trạng thái',
    'Đúng giờ',
    'Muộn',
    'Vắng',
    'Tắt cam',
    'Nộp bài đúng hạn',
    'Tổng lượt lưu ý',
    'Ghi chú',
  ];

  const lines = [
    headers.join('\t'),
    ...rows.map((row) =>
      headers.map((header) => sanitizeTsvCell(row[header])).join('\t')
    ),
  ];

  return lines.join('\n');
}

export async function copyWeekSummaryForGoogleSheets(
  week: WeekConfig,
  members: Member[],
  logs: DailyLog[],
  groupNames?: Record<GroupId, string>
): Promise<boolean> {
  const tsv = buildWeekSummaryTsv(week, members, logs, groupNames);

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
