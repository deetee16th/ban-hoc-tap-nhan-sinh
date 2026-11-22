import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, Lock, Moon, Sun } from 'lucide-react';
import {
  CheckInSessionMode,
  DailyLog,
  getGroupDisplayName,
  GROUPS,
  GroupId,
  Member,
  normalizeGroupId,
  UserAccount,
  WeekConfig,
} from '../../types';
import {
  formatDateVN,
  formatShortDateVN,
  getWeekdayVN,
  isLogEveningPerfect,
  isLogMorningPerfect,
  isMemberEligibleOnDate,
  isMemberInactiveOnDate,
  isMemberNotJoinedYet,
} from '../../utils/analytics';
import { getLockedGroup } from '../../utils/auth';
import { EveningGradingCard } from './EveningGradingCard';
import { MorningCheckInRow } from './MorningCheckInRow';

interface DailyCheckInProps {
  members: Member[];
  logs: DailyLog[];
  weeks: WeekConfig[];
  selectedWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  lockedGroup: GroupId | null;
  currentAccount: UserAccount | null;
  groupNames: Record<GroupId, string>;
  onUpsertLog: (log: DailyLog) => void;
  onUpsertLogsBatch: (logs: DailyLog[]) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  members,
  logs,
  weeks,
  selectedWeek,
  onSelectWeek,
  lockedGroup,
  currentAccount,
  groupNames,
  onUpsertLog,
  onUpsertLogsBatch,
  onNotify,
}) => {
  const currentWeek = useMemo(
    () => weeks.find((w) => w.weekNumber === selectedWeek) ?? weeks[0],
    [weeks, selectedWeek]
  );

  const resolvedLockedGroup = useMemo(
    () => normalizeGroupId(lockedGroup) ?? getLockedGroup(currentAccount),
    [lockedGroup, currentAccount]
  );

  const [sessionMode, setSessionMode] =
    useState<CheckInSessionMode>('morning');
  const [selectedGroup, setSelectedGroup] = useState<GroupId>(
    resolvedLockedGroup ?? 'G1'
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    () => currentWeek?.studyDates[0] ?? ''
  );

  // Khóa cứng nhóm khi Cán sự nhóm đăng nhập
  useEffect(() => {
    if (resolvedLockedGroup) {
      setSelectedGroup(resolvedLockedGroup);
    }
  }, [resolvedLockedGroup]);

  // Đảm bảo selectedDate luôn thuộc danh sách ngày học của tuần hiện tại
  useEffect(() => {
    const dates = currentWeek?.studyDates ?? [];
    if (dates.length === 0) {
      setSelectedDate('');
      return;
    }
    if (!dates.includes(selectedDate)) {
      setSelectedDate(dates[0]);
    }
  }, [currentWeek, selectedDate]);

  const activeGroup: GroupId =
    resolvedLockedGroup ?? normalizeGroupId(selectedGroup) ?? 'G1';

  const handleWeekChange = (weekNumber: number) => {
    onSelectWeek(weekNumber);
    const targetWeek = weeks.find((w) => w.weekNumber === weekNumber);
    if (targetWeek && targetWeek.studyDates.length > 0) {
      setSelectedDate(targetWeek.studyDates[0]);
    }
  };

  // Bản đồ log theo (date, memberId)
  const dateLogByMember = useMemo(() => {
    const map = new Map<string, DailyLog>();
    if (!selectedDate) return map;
    for (const log of logs) {
      if (log.date === selectedDate) {
        map.set(log.memberId, log);
      }
    }
    return map;
  }, [logs, selectedDate]);

  // Thành viên của nhóm đang chấm (tự động ẨN học viên đã nghỉ từ ngày này trở đi)
  const visibleGroupMembers = useMemo(() => {
    if (!selectedDate) return [];
    return members
      .filter(
        (m) =>
          (normalizeGroupId(m.group) ?? m.group) === activeGroup &&
          !isMemberInactiveOnDate(m, selectedDate)
      )
      .sort((a, b) => a.stt - b.stt);
  }, [members, activeGroup, selectedDate]);

  // Thành viên đủ điều kiện chấm điểm ngày này (không ẩn do nghỉ & đã tới ngày tham gia)
  const eligibleGroupMembers = useMemo(() => {
    if (!selectedDate) return [];
    return visibleGroupMembers.filter((m) =>
      isMemberEligibleOnDate(m, selectedDate)
    );
  }, [visibleGroupMembers, selectedDate]);

  // Thống kê số lượng đã chấm theo từng buổi (chỉ tính học viên đủ điều kiện ngày này)
  const groupProgress = useMemo(() => {
    const progress: Record<GroupId, { done: number; total: number }> = {
      G1: { done: 0, total: 0 },
      G2: { done: 0, total: 0 },
      G3: { done: 0, total: 0 },
      G4: { done: 0, total: 0 },
    };

    if (!selectedDate) return progress;

    for (const member of members) {
      if (!isMemberEligibleOnDate(member, selectedDate)) continue;
      const memberGroup = normalizeGroupId(member.group) ?? 'G1';
      progress[memberGroup].total += 1;
      const log = dateLogByMember.get(member.id);
      if (!log) continue;

      if (sessionMode === 'morning') {
        if (log.attendance !== 'Chưa chấm' || log.camera !== 'Chưa chấm') {
          progress[memberGroup].done += 1;
        }
      } else if (log.homework !== 'Chưa chấm') {
        progress[memberGroup].done += 1;
      }
    }
    return progress;
  }, [members, dateLogByMember, sessionMode, selectedDate]);

  const activeGroupStat = groupProgress[activeGroup];
  const progressPercent =
    activeGroupStat.total > 0
      ? Math.round((activeGroupStat.done / activeGroupStat.total) * 100)
      : 0;

  const perfectMorningCount = useMemo(() => {
    return eligibleGroupMembers.filter((m) => {
      const log = dateLogByMember.get(m.id);
      return log ? isLogMorningPerfect(log) : false;
    }).length;
  }, [eligibleGroupMembers, dateLogByMember]);

  const perfectEveningCount = useMemo(() => {
    return eligibleGroupMembers.filter((m) => {
      const log = dateLogByMember.get(m.id);
      return log ? isLogEveningPerfect(log) : false;
    }).length;
  }, [eligibleGroupMembers, dateLogByMember]);

  // Thao tác hàng loạt Sáng: chỉ cập nhật attendance + camera, GIỮ NGUYÊN homework & các ghi chú
  const handleMarkGroupMorningPerfect = () => {
    if (!selectedDate || eligibleGroupMembers.length === 0) return;

    const batch: DailyLog[] = eligibleGroupMembers.map((member) => {
      const existing = dateLogByMember.get(member.id);
      return {
        id: existing?.id ?? `log-${selectedDate}-${member.id}`,
        date: selectedDate,
        weekNumber: selectedWeek,
        memberId: member.id,
        attendance: 'Đúng giờ',
        camera: 'Có',
        homework: existing?.homework ?? 'Chưa chấm',
        morningNote: existing?.morningNote ?? '',
        homeworkFeedback: existing?.homeworkFeedback ?? '',
        generalNote: existing?.generalNote ?? '',
      };
    });

    onUpsertLogsBatch(batch);
    onNotify(
      `Đã điểm danh sáng ${getGroupDisplayName(activeGroup, groupNames)} (${eligibleGroupMembers.length} học viên): Đúng giờ & Mở cam.`
    );
  };

  // Thao tác hàng loạt Tối: chỉ cập nhật homework, GIỮ NGUYÊN attendance/camera & các ghi chú
  const handleMarkGroupEveningPerfect = () => {
    if (!selectedDate || eligibleGroupMembers.length === 0) return;

    const batch: DailyLog[] = eligibleGroupMembers.map((member) => {
      const existing = dateLogByMember.get(member.id);
      return {
        id: existing?.id ?? `log-${selectedDate}-${member.id}`,
        date: selectedDate,
        weekNumber: selectedWeek,
        memberId: member.id,
        attendance: existing?.attendance ?? 'Chưa chấm',
        camera: existing?.camera ?? 'Chưa chấm',
        homework: 'Đúng hạn',
        morningNote: existing?.morningNote ?? '',
        homeworkFeedback: existing?.homeworkFeedback ?? '',
        generalNote: existing?.generalNote ?? '',
      };
    });

    onUpsertLogsBatch(batch);
    onNotify(
      `Đã chấm bài tối ${getGroupDisplayName(activeGroup, groupNames)} (${eligibleGroupMembers.length} học viên): Nộp bài Đúng hạn.`
    );
  };

  const activeGroupName = getGroupDisplayName(activeGroup, groupNames);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header & Quick Filters */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Chấm điểm 1 chạm theo buổi
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Sổ Theo Dõi Ngày
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chọn tuần và chạm trực tiếp ngày học bên dưới để điểm danh sáng hoặc chấm bài tối.
            </p>
          </div>

          <span className="inline-flex items-center self-start sm:self-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            Tự động lưu tức thì
          </span>
        </div>

        {/* Bộ lọc đơn giản hóa: Chỉ gồm Dropdown Tuần + Nút chọn Ngày thuộc tuần đó */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-200/80">
          <div className="lg:col-span-4">
            <label
              htmlFor="checkin-week-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
            >
              Chọn Tuần học
            </label>
            <select
              id="checkin-week-select"
              value={selectedWeek}
              onChange={(e) => handleWeekChange(Number(e.target.value))}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm sm:text-base"
            >
              {weeks.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  {w.label}
                  {w.topic ? ` — ${w.topic}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 tabular-nums">
                Chọn Ngày học trong {currentWeek?.label ?? `Tuần ${selectedWeek}`}
                {selectedDate ? ` (${formatDateVN(selectedDate)})` : ''}
              </span>
            </div>

            {currentWeek && currentWeek.studyDates.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {currentWeek.studyDates.map((d) => {
                  const active = selectedDate === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold border tabular-nums transition-all ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {getWeekdayVN(d)} {formatShortDateVN(d)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                Tuần này chưa được cấu hình ngày học. Admin có thể thêm ngày học ở Tab Quản Lý Lớp.
              </p>
            )}
          </div>
        </div>

        {/* Chọn Nhóm */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            {resolvedLockedGroup ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Nhóm phụ trách của tài khoản</span>
              </>
            ) : (
              <span>Chọn Nhóm để chấm / chấm hộ (4 nhóm G1 – G4)</span>
            )}
          </div>

          {resolvedLockedGroup ? (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-extrabold text-sm">
                  {getGroupDisplayName(resolvedLockedGroup, groupNames)}
                </span>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                    Đang chấm {getGroupDisplayName(resolvedLockedGroup, groupNames)} (
                    {groupProgress[resolvedLockedGroup].done}/
                    {groupProgress[resolvedLockedGroup].total} đã chấm)
                  </div>
                  <div className="text-xs font-medium text-emerald-800">
                    {currentAccount?.displayName ?? 'Cán sự nhóm'} chỉ xem và chấm điểm cho nhóm phụ trách
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" />
                <span>Đã khóa nhóm</span>
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GROUPS.map((groupId) => {
                const active = activeGroup === groupId;
                const stat = groupProgress[groupId];

                return (
                  <button
                    key={groupId}
                    type="button"
                    onClick={() => setSelectedGroup(groupId)}
                    className={`min-h-[54px] px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-[15px] leading-tight truncate">
                        {getGroupDisplayName(groupId, groupNames)}
                      </div>
                      <div
                        className={`text-xs font-medium mt-0.5 tabular-nums ${
                          active ? 'text-white/80' : 'text-slate-500'
                        }`}
                      >
                        {stat.done}/{stat.total} đã chấm
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-surface text-slate-600 border border-slate-200'
                      }`}
                    >
                      {groupId}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2 Sub-tabs lớn: Điểm Danh Sáng vs Chấm Bài Tối */}
      <section aria-label="Chọn ca chấm điểm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSessionMode('morning')}
            className={`min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
              sessionMode === 'morning'
                ? 'bg-amber-50/70 border-amber-400'
                : 'bg-surface hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                sessionMode === 'morning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Sun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900 leading-snug">
                Điểm Danh Sáng (Giờ &amp; Camera)
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                Chạm giờ vào lớp, mở cam &amp; ghi lý do sáng
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSessionMode('evening')}
            className={`min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
              sessionMode === 'evening'
                ? 'bg-sky-50/70 border-sky-400'
                : 'bg-surface hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                sessionMode === 'evening'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Moon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold text-slate-900 leading-snug">
                Chấm Bài Tối (Bài tập &amp; Điểm sáng)
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                Chấm bài đúc kết, viết nhận xét cảm xúc &amp; ghi chú
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Action Bar: Bulk Mark + Copy Zalo Report + Grading Progress Bar */}
      {selectedDate && (
        <section className="bg-surface rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                {sessionMode === 'morning' ? 'Điểm danh sáng' : 'Chấm bài tối'} •{' '}
                {activeGroupName} • {getWeekdayVN(selectedDate)}{' '}
                {formatDateVN(selectedDate)}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5 tabular-nums">
                {sessionMode === 'morning' ? (
                  <>
                    Đúng giờ &amp; mở cam:{' '}
                    <span className="font-bold text-emerald-700">
                      {perfectMorningCount}/{eligibleGroupMembers.length} thành viên
                    </span>
                  </>
                ) : (
                  <>
                    Nộp bài đúng hạn:{' '}
                    <span className="font-bold text-emerald-700">
                      {perfectEveningCount}/{eligibleGroupMembers.length} thành viên
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={
                  sessionMode === 'morning'
                    ? handleMarkGroupMorningPerfect
                    : handleMarkGroupEveningPerfect
                }
                disabled={eligibleGroupMembers.length === 0}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl disabled:opacity-50 text-white font-bold text-sm transition-all ${
                  sessionMode === 'morning'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>
                  {sessionMode === 'morning'
                    ? 'Đánh dấu cả nhóm Đúng giờ & Mở cam'
                    : 'Đánh dấu cả nhóm Nộp bài Đúng hạn'}
                </span>
              </button>
            </div>
          </div>

          {/* Thanh tiến độ chấm điểm của nhóm ngay phía trên danh sách thành viên */}
          <div className="pt-3.5 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-slate-700 tabular-nums">
                Tiến độ nhóm: Đã ghi nhận{' '}
                <strong className="text-slate-900">
                  {activeGroupStat.done}/{activeGroupStat.total}
                </strong>{' '}
                thành viên
              </span>
              <span className="font-bold text-emerald-700 tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến độ ghi nhận của nhóm"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sessionMode === 'morning' ? 'bg-emerald-600' : 'bg-sky-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Member List */}
      {!selectedDate ? (
        <div className="bg-surface rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-600">
            Vui lòng chọn một ngày học để bắt đầu chấm điểm.
          </p>
        </div>
      ) : visibleGroupMembers.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-600">
            Nhóm này hiện không có thành viên đang hoạt động trong ngày{' '}
            {formatDateVN(selectedDate)}.
          </p>
        </div>
      ) : (
        <div className={sessionMode === 'morning' ? 'space-y-3' : 'space-y-4'}>
          {visibleGroupMembers.map((member) => {
            // Thành viên mới vào sau ngày đang chọn -> hiển thị trạng thái 'Chưa tham gia'
            if (isMemberNotJoinedYet(member, selectedDate)) {
              return (
                <div
                  key={member.id}
                  className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 px-4 py-3.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                      {member.stt}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-bold text-slate-600 truncate">
                        {member.fullName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        Tham gia lớp từ ngày {formatDateVN(member.joinedDate)}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-slate-200 text-xs font-semibold text-slate-500">
                    Chưa tham gia
                  </span>
                </div>
              );
            }

            return sessionMode === 'morning' ? (
              <MorningCheckInRow
                key={member.id}
                member={member}
                log={dateLogByMember.get(member.id)}
                date={selectedDate}
                weekNumber={selectedWeek}
                onChangeLog={onUpsertLog}
              />
            ) : (
              <EveningGradingCard
                key={member.id}
                member={member}
                log={dateLogByMember.get(member.id)}
                date={selectedDate}
                weekNumber={selectedWeek}
                onChangeLog={onUpsertLog}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
