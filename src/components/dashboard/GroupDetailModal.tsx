import React, { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquareText, X } from 'lucide-react';
import {
  DailyLog,
  getGroupDisplayName,
  GROUP_META,
  GroupId,
  Member,
  WeekConfig,
} from '../../types';
import {
  formatDateVN,
  formatShortDateVN,
  getWeekdayVN,
  isLogGraded,
  isLogPerfect,
  isMemberActiveInWeek,
  isMemberEligibleOnDate,
  isMemberInactiveOnDate,
  isMemberNotJoinedYet,
} from '../../utils/analytics';

interface GroupDetailModalProps {
  isOpen: boolean;
  group: GroupId | null;
  week: WeekConfig | undefined;
  members: Member[];
  logs: DailyLog[];
  groupNames: Record<GroupId, string>;
  presentationNote: string;
  canEditPresentationNote: boolean;
  onSavePresentationNote: (
    weekNumber: number,
    group: GroupId,
    note: string
  ) => void;
  onClose: () => void;
}

interface SelectedCellInfo {
  memberName: string;
  date: string;
  log: DailyLog;
}

function getAttendanceBadge(status: DailyLog['attendance']): {
  label: string;
  cls: string;
} {
  switch (status) {
    case 'Đúng giờ':
      return {
        label: 'Đúng giờ',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'Muộn':
      return {
        label: 'Muộn',
        cls: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    case 'Vắng CP':
      return {
        label: 'Vắng CP',
        cls: 'bg-sky-100 text-sky-900 border-sky-300',
      };
    case 'Vắng':
      return {
        label: 'Vắng',
        cls: 'bg-rose-100 text-rose-900 border-rose-300',
      };
    default:
      return {
        label: 'Chưa chấm',
        cls: 'bg-slate-100 text-slate-500 border-slate-200',
      };
  }
}

function getHomeworkBadge(status: DailyLog['homework']): {
  label: string;
  cls: string;
} {
  switch (status) {
    case 'Đúng hạn':
      return {
        label: 'Bài ✓',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'Muộn':
      return {
        label: 'Bài muộn',
        cls: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    case 'Muộn CP':
      return {
        label: 'Muộn CP',
        cls: 'bg-sky-100 text-sky-900 border-sky-300',
      };
    case 'Chưa nộp':
      return {
        label: 'Chưa nộp',
        cls: 'bg-orange-100 text-orange-900 border-orange-300',
      };
    case 'Không nộp':
      return {
        label: 'Không nộp',
        cls: 'bg-rose-100 text-rose-900 border-rose-300',
      };
    default:
      return {
        label: 'Bài —',
        cls: 'bg-slate-100 text-slate-500 border-slate-200',
      };
  }
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  group,
  week,
  members,
  logs,
  groupNames,
  presentationNote,
  canEditPresentationNote,
  onSavePresentationNote,
  onClose,
}) => {
  const [noteDraft, setNoteDraft] = useState(presentationNote);
  const [selectedCell, setSelectedCell] = useState<SelectedCellInfo | null>(
    null
  );

  useEffect(() => {
    setNoteDraft(presentationNote);
    setSelectedCell(null);
  }, [presentationNote, group, week?.weekNumber, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onClose]);

  const studyDates = useMemo(() => week?.studyDates ?? [], [week]);

  const groupMembers = useMemo(() => {
    if (!group) return [];
    return members
      .filter((m) => m.group === group && isMemberActiveInWeek(m, studyDates))
      .sort((a, b) => a.stt - b.stt);
  }, [members, group, studyDates]);

  const logByKey = useMemo(() => {
    const map = new Map<string, DailyLog>();
    const dateSet = new Set(studyDates);
    for (const log of logs) {
      if (dateSet.has(log.date)) {
        map.set(`${log.date}::${log.memberId}`, log);
      }
    }
    return map;
  }, [logs, studyDates]);

  // Tổng hợp tự động các lượt đi muộn, vắng, tắt cam, thiếu bài kèm lý do của riêng nhóm
  const groupIssues = useMemo(() => {
    const items: Array<{
      member: Member;
      date: string;
      tags: string[];
      morningNote: string;
      generalNote: string;
    }> = [];

    for (const member of groupMembers) {
      for (const date of studyDates) {
        if (!isMemberEligibleOnDate(member, date)) continue;
        const log = logByKey.get(`${date}::${member.id}`);
        if (!log || !isLogGraded(log) || isLogPerfect(log)) continue;

        const tags: string[] = [];
        if (log.attendance === 'Muộn') tags.push('Vào muộn');
        if (log.attendance === 'Vắng' || log.attendance === 'Vắng CP') {
          tags.push(log.attendance);
        }
        if (
          (log.attendance === 'Đúng giờ' || log.attendance === 'Muộn') &&
          log.camera === 'Không'
        ) {
          tags.push('Tắt cam');
        }
        if (log.homework !== 'Đúng hạn' && log.homework !== 'Chưa chấm') {
          tags.push(`Bài: ${log.homework}`);
        }

        if (tags.length > 0) {
          items.push({
            member,
            date,
            tags,
            morningNote: log.morningNote.trim(),
            generalNote: log.generalNote.trim(),
          });
        }
      }
    }

    return items.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.member.stt - b.member.stt;
    });
  }, [groupMembers, studyDates, logByKey]);

  if (!isOpen || !group || !week) return null;

  const meta = GROUP_META[group];
  const groupTitle = getGroupDisplayName(group, groupNames);

  const handleSaveNote = () => {
    onSavePresentationNote(week.weekNumber, group, noteDraft);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl border border-slate-200 shadow-elevated w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
            <span
              className={`px-3 py-1 rounded-lg border font-bold text-sm sm:text-base ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
            >
              {groupTitle}
            </span>
            <div className="min-w-0">
              <h2
                id="group-detail-title"
                className="text-base sm:text-xl font-extrabold text-slate-900 truncate tabular-nums"
              >
                Chi tiết {week.label} • {groupMembers.length} thành viên hoạt động
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 tabular-nums">
                {formatDateVN(week.startDate)} – {formatDateVN(week.endDate)} (
                {studyDates.length} buổi học)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết nhóm"
            className="tap-compact p-2 rounded-xl text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-7 space-y-6">
          {/* PHẦN 1: Bảng theo dõi chi tiết từng ngày trong tuần */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                1. Bảng theo dõi từng ngày trong {week.label}
              </h3>
              <span className="text-xs text-slate-500">
                Vuốt ngang để xem các buổi • Bấm vào từng ô để xem ghi chú
              </span>
            </div>

            {studyDates.length === 0 || groupMembers.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Chưa có dữ liệu ngày học hoặc thành viên hoạt động trong tuần này.
              </div>
            ) : (
              <div className="overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch] rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[580px] sm:min-w-[680px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                      <th className="py-2.5 px-3 sm:py-3 sm:px-4 w-36 sm:w-56 min-w-[136px] max-w-[152px] sm:max-w-none sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        Thành viên
                      </th>
                      {studyDates.map((d) => (
                        <th
                          key={d}
                          className="py-2.5 px-2.5 sm:py-3 sm:px-3 min-w-[112px] sm:min-w-[132px] text-center tabular-nums"
                        >
                          <div>{getWeekdayVN(d)}</div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {formatShortDateVN(d)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-xs">
                    {groupMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 w-36 sm:w-56 min-w-[136px] max-w-[152px] sm:max-w-none sticky left-0 bg-surface z-10 border-r border-slate-200/70 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5 leading-tight">
                            {member.role}
                            {studyDates[0] &&
                            member.joinedDate > studyDates[0]
                              ? ` • Vào từ ${formatShortDateVN(member.joinedDate)}`
                              : ''}
                          </div>
                        </td>

                        {studyDates.map((date) => {
                          if (isMemberNotJoinedYet(member, date)) {
                            return (
                              <td key={date} className="py-2.5 px-2 text-center">
                                <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-slate-400 font-semibold text-[11px]">
                                  Chưa tham gia
                                </span>
                              </td>
                            );
                          }

                          const log = logByKey.get(`${date}::${member.id}`);

                          if (isMemberInactiveOnDate(member, date) && !log) {
                            return (
                              <td key={date} className="py-2.5 px-2 text-center">
                                <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-slate-400 font-semibold text-[11px]">
                                  Đã nghỉ
                                </span>
                              </td>
                            );
                          }

                          if (!log || !isLogGraded(log)) {
                            return (
                              <td key={date} className="py-2.5 px-2 text-center">
                                <span className="text-slate-400 font-medium">
                                  Chưa chấm
                                </span>
                              </td>
                            );
                          }

                          const attBadge = getAttendanceBadge(log.attendance);
                          const hwBadge = getHomeworkBadge(log.homework);
                          const hasNote =
                            log.morningNote.trim().length > 0 ||
                            log.homeworkFeedback.trim().length > 0 ||
                            log.generalNote.trim().length > 0;

                          const tooltipLines = [
                            log.morningNote.trim()
                              ? `Ghi chú sáng: ${log.morningNote.trim()}`
                              : '',
                            log.homeworkFeedback.trim()
                              ? `Nhận xét bài: ${log.homeworkFeedback.trim()}`
                              : '',
                            log.generalNote.trim()
                              ? `Ghi chú chung: ${log.generalNote.trim()}`
                              : '',
                          ]
                            .filter(Boolean)
                            .join('\n');

                          const isSelected =
                            selectedCell?.date === date &&
                            selectedCell?.memberName === member.fullName;

                          return (
                            <td key={date} className="py-2 px-2 text-center align-top">
                              <button
                                type="button"
                                title={
                                  tooltipLines ||
                                  `${member.fullName} - ${formatDateVN(date)}`
                                }
                                onClick={() =>
                                  setSelectedCell({
                                    memberName: member.fullName,
                                    date,
                                    log,
                                  })
                                }
                                className={`tap-compact w-full rounded-lg border p-1.5 space-y-1 transition-all text-left ${
                                  isSelected
                                    ? 'border-emerald-600 ring-2 ring-emerald-200 bg-emerald-50/40'
                                    : hasNote
                                      ? 'border-amber-300 bg-amber-50/35 hover:border-amber-500'
                                      : 'border-slate-200 bg-surface hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold truncate ${attBadge.cls}`}
                                  >
                                    {attBadge.label}
                                  </span>
                                  {hasNote && (
                                    <MessageSquareText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                                  <span
                                    className={`px-1.5 py-0.5 rounded ${
                                      log.camera === 'Có'
                                        ? 'bg-sky-50 text-sky-800'
                                        : log.camera === 'Không'
                                          ? 'bg-slate-200 text-slate-800'
                                          : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {log.camera === 'Có'
                                      ? 'Cam ✓'
                                      : log.camera === 'Không'
                                        ? 'Tắt cam'
                                        : '—'}
                                  </span>

                                  <span
                                    className={`px-1.5 py-0.5 rounded border truncate ${hwBadge.cls}`}
                                  >
                                    {hwBadge.label}
                                  </span>
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Khung hiển thị chi tiết ô đang bấm */}
            {selectedCell && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900 tabular-nums">
                    Chi tiết: {selectedCell.memberName} •{' '}
                    {getWeekdayVN(selectedCell.date)}{' '}
                    {formatDateVN(selectedCell.date)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCell(null)}
                    className="tap-compact text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
                  >
                    Đóng
                  </button>
                </div>
                <div className="text-xs font-medium text-slate-600">
                  Vào lớp: <strong>{selectedCell.log.attendance}</strong> •
                  Camera: <strong>{selectedCell.log.camera}</strong> • Bài tập:{' '}
                  <strong>{selectedCell.log.homework}</strong>
                </div>
                {selectedCell.log.morningNote.trim() && (
                  <p className="text-xs sm:text-sm text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <strong>Ghi chú buổi sáng:</strong>{' '}
                    {selectedCell.log.morningNote}
                  </p>
                )}
                {selectedCell.log.homeworkFeedback.trim() && (
                  <p className="text-xs sm:text-sm text-emerald-950 bg-surface border border-emerald-200 rounded-lg px-3 py-2">
                    <strong>Nhận xét &amp; Đánh giá bài:</strong>{' '}
                    {selectedCell.log.homeworkFeedback}
                  </p>
                )}
                {selectedCell.log.generalNote.trim() && (
                  <p className="text-xs sm:text-sm text-slate-700 bg-surface border border-slate-200 rounded-lg px-3 py-2">
                    <strong>Ghi chú chung:</strong>{' '}
                    {selectedCell.log.generalNote}
                  </p>
                )}
                {!selectedCell.log.morningNote.trim() &&
                  !selectedCell.log.homeworkFeedback.trim() &&
                  !selectedCell.log.generalNote.trim() && (
                    <p className="text-xs text-slate-500 italic">
                      Buổi học này không có ghi chú đính kèm.
                    </p>
                  )}
              </div>
            )}
          </section>

          {/* PHẦN 2: Góc Trình Bày Vấn Đề Nhóm */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-slate-200">
            {/* 2a. Tự động tổng hợp các lượt lưu ý của riêng nhóm */}
            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                2. Tổng hợp các lượt lưu ý của {groupTitle} ({groupIssues.length})
              </h3>

              {groupIssues.length === 0 ? (
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-5 text-sm font-semibold text-emerald-800">
                  {groupTitle} không có lượt đi muộn, vắng, tắt cam hay thiếu bài nào trong {week.label}.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {groupIssues.map((issue, idx) => (
                    <div
                      key={`${issue.member.id}-${issue.date}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5 text-xs sm:text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {issue.member.fullName}
                        </span>
                        <span className="font-medium text-slate-500 text-xs tabular-nums">
                          {getWeekdayVN(issue.date)}{' '}
                          {formatShortDateVN(issue.date)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {issue.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-bold text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {issue.morningNote && (
                        <p className="text-amber-900 leading-relaxed">
                          <span className="font-bold">Lý do sáng:</span>{' '}
                          {issue.morningNote}
                        </p>
                      )}
                      {issue.generalNote && (
                        <p className="text-slate-600 leading-relaxed">
                          <span className="font-bold">Ghi chú:</span>{' '}
                          {issue.generalNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2b. Khung Ghi chú trình bày của nhóm trên Zoom */}
            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Ghi chú trình bày vấn đề &amp; hướng hỗ trợ
              </h3>

              {canEditPresentationNote ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
                  <textarea
                    rows={6}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder={`Ghi tóm tắt điểm cần lưu ý và hướng đồng hành cho ${groupTitle} trong buổi tổng kết Zoom...`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-sky-200 focus:border-sky-500 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 resize-y"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Chỉ Admin &amp; Ban Học Tập có quyền chỉnh sửa nội dung này
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu ghi chú trình bày</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 leading-relaxed min-h-[140px] whitespace-pre-line">
                  {presentationNote.trim()
                    ? presentationNote
                    : 'Ban Học Tập chưa thêm ghi chú trình bày cho nhóm này trong tuần.'}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
