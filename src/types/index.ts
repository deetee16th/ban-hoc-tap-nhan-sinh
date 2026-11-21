export type GroupId = 'G1' | 'G2' | 'G3' | 'G4';

export type MemberRole =
  | 'Trưởng ban học tập'
  | 'Ban học tập'
  | 'Trưởng nhóm'
  | 'Phó nhóm'
  | 'Thành viên';

export type MemberStatus = 'active' | 'inactive';

export type AttendanceStatus =
  | 'Đúng giờ'
  | 'Muộn'
  | 'Vắng CP'
  | 'Vắng'
  | 'Chưa chấm';

export type HomeworkStatus =
  | 'Đúng hạn'
  | 'Muộn'
  | 'Muộn CP'
  | 'Chưa nộp'
  | 'Không nộp'
  | 'Chưa chấm';

export type CameraStatus = 'Có' | 'Không' | 'Chưa chấm';

export type AccountRole = 'admin' | 'banhoctap' | 'group_officer';

export type AuthLevel = 'guest' | 'group_officer' | 'banhoctap' | 'admin';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: AccountRole;
  assignedGroup: GroupId | null;
}

export interface UiSettings {
  appName: string;
  appSubtitle: string;
  groupNames: Record<GroupId, string>;
  showGroupSummary: boolean;
  showPercentage: boolean;
  allowGroupOfficerViewOtherGroups: boolean;
}

export const DEFAULT_UI_SETTINGS: UiSettings = {
  appName: 'Lớp Nhân Sinh',
  appSubtitle: 'Quản lý học tập & rèn luyện',
  groupNames: {
    G1: 'Nhóm 1',
    G2: 'Nhóm 2',
    G3: 'Nhóm 3',
    G4: 'Nhóm 4',
  },
  showGroupSummary: true,
  showPercentage: false,
  allowGroupOfficerViewOtherGroups: true,
};

export type CheckInSessionMode = 'morning' | 'evening';

export interface Member {
  id: string;
  stt: number;
  fullName: string;
  group: GroupId;
  role: MemberRole;
  status: MemberStatus;
  joinedDate: string; // YYYY-MM-DD
  inactiveDate?: string; // YYYY-MM-DD (khi status === 'inactive')
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber: number;
  memberId: string;
  attendance: AttendanceStatus;
  homework: HomeworkStatus;
  camera: CameraStatus;
  morningNote: string; // Ghi chú buổi sáng (lý do/số phút muộn, vắng, tắt cam)
  homeworkFeedback: string; // Nhận xét & đánh giá bài theo cảm xúc -> đổ sang Điểm Sáng
  generalNote: string; // Ghi chú thông thường khách quan
}

export interface WeekConfig {
  weekNumber: number;
  label: string;
  topic: string;
  startDate: string;
  endDate: string;
  studyDates: string[];
}

export type GroupPresentationNoteMap = Record<string, string>; // key: `${weekNumber}::${groupId}`

export type TabId = 'dashboard' | 'checkin' | 'insights' | 'admin';

export const GROUPS: GroupId[] = ['G1', 'G2', 'G3', 'G4'];

export interface GroupVisualMeta {
  id: GroupId;
  name: string;
  shortName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBar: string;
  softPanel: string;
}

export const GROUP_META: Record<GroupId, GroupVisualMeta> = {
  G1: {
    id: 'G1',
    name: 'Nhóm 1',
    shortName: 'G1',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    accentBar: 'bg-emerald-500',
    softPanel: 'bg-emerald-50/60 border-emerald-200/80',
  },
  G2: {
    id: 'G2',
    name: 'Nhóm 2',
    shortName: 'G2',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    accentBar: 'bg-sky-500',
    softPanel: 'bg-sky-50/60 border-sky-200/80',
  },
  G3: {
    id: 'G3',
    name: 'Nhóm 3',
    shortName: 'G3',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBar: 'bg-amber-500',
    softPanel: 'bg-amber-50/60 border-amber-200/80',
  },
  G4: {
    id: 'G4',
    name: 'Nhóm 4',
    shortName: 'G4',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    accentBar: 'bg-indigo-500',
    softPanel: 'bg-indigo-50/60 border-indigo-200/80',
  },
};

export function getGroupDisplayName(
  groupId: GroupId,
  groupNames?: Record<GroupId, string>
): string {
  const custom = groupNames?.[groupId]?.trim();
  return custom && custom.length > 0 ? custom : GROUP_META[groupId].name;
}

export function getGroupPresentationNoteKey(
  weekNumber: number,
  group: GroupId
): string {
  return `${weekNumber}::${group}`;
}

export const ROLE_OPTIONS: MemberRole[] = [
  'Trưởng ban học tập',
  'Ban học tập',
  'Trưởng nhóm',
  'Phó nhóm',
  'Thành viên',
];

export type AttendanceButtonOption = Exclude<AttendanceStatus, 'Chưa chấm'>;
export type HomeworkButtonOption = Exclude<HomeworkStatus, 'Chưa chấm'>;
export type CameraButtonOption = Exclude<CameraStatus, 'Chưa chấm'>;

export const ATTENDANCE_OPTIONS: AttendanceButtonOption[] = [
  'Đúng giờ',
  'Muộn',
  'Vắng CP',
  'Vắng',
];

export const HOMEWORK_OPTIONS: HomeworkButtonOption[] = [
  'Đúng hạn',
  'Muộn',
  'Muộn CP',
  'Chưa nộp',
  'Không nộp',
];

export const CAMERA_OPTIONS: CameraButtonOption[] = ['Có', 'Không'];
