import React, { useMemo, useState } from 'react';
import { Maximize2, Minimize2, Presentation } from 'lucide-react';
import {
  DailyLog,
  getGroupPresentationNoteKey,
  GroupId,
  GroupPresentationNoteMap,
  Member,
  UiSettings,
  WeekConfig,
} from '../../types';
import { computeWeeklyDashboard, formatDateVN } from '../../utils/analytics';
import { DisplayControls } from '../layout/DisplayControls';
import { GroupDetailModal } from './GroupDetailModal';
import { GroupSummaryGrid } from './GroupSummaryGrid';
import { KpiCards } from './KpiCards';
import { MemberDetailsBoard } from './MemberDetailsBoard';

interface WeeklyDashboardProps {
  members: Member[];
  logs: DailyLog[];
  weeks: WeekConfig[];
  selectedWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  uiSettings: UiSettings;
  groupNotes: GroupPresentationNoteMap;
  onSaveGroupNote: (weekNumber: number, group: GroupId, note: string) => void;
  canUsePresentation: boolean;
  canViewIndividualDetails: boolean;
  lockedGroup: GroupId | null;
  visibleGroupFilter: GroupId | null;
  isAdmin: boolean;
  isPresentationMode: boolean;
  onTogglePresentation: (next: boolean) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

type PresentationFocus = 'all' | 'overview' | 'members';

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
  members,
  logs,
  weeks,
  selectedWeek,
  onSelectWeek,
  uiSettings,
  groupNotes,
  onSaveGroupNote,
  canUsePresentation,
  canViewIndividualDetails,
  lockedGroup,
  visibleGroupFilter,
  isAdmin,
  isPresentationMode,
  onTogglePresentation,
  onNotify,
}) => {
  const [focusView, setFocusView] = useState<PresentationFocus>('all');
  const [detailGroup, setDetailGroup] = useState<GroupId | null>(null);

  const currentWeek = useMemo(
    () => weeks.find((w) => w.weekNumber === selectedWeek) ?? weeks[0],
    [weeks, selectedWeek]
  );

  const stats = useMemo(
    () =>
      computeWeeklyDashboard(
        members,
        logs,
        selectedWeek,
        currentWeek?.studyDates
      ),
    [members, logs, selectedWeek, currentWeek]
  );

  const visibleGroupSummaries = useMemo(() => {
    if (!visibleGroupFilter) return stats.groupSummaries;
    return stats.groupSummaries.filter((g) => g.group === visibleGroupFilter);
  }, [stats.groupSummaries, visibleGroupFilter]);

  const canClickGroup = (groupId: GroupId): boolean => {
    if (canViewIndividualDetails) return true; // admin & banhoctap xem được cả 4 nhóm
    if (lockedGroup && lockedGroup === groupId) return true; // cán sự nhóm xem được nhóm của mình
    return false;
  };

  const handleSelectGroupCard = (groupId: GroupId) => {
    if (!canClickGroup(groupId)) return;
    setDetailGroup(groupId);
  };

  const showOverview = !isPresentationMode || focusView !== 'members';
  const showMembers =
    canViewIndividualDetails &&
    (!isPresentationMode || focusView !== 'overview');

  const activeGroupNote =
    detailGroup && currentWeek
      ? groupNotes[
          getGroupPresentationNoteKey(currentWeek.weekNumber, detailGroup)
        ] ?? ''
      : '';

  return (
    <div
      className={`space-y-6 animate-fade-in ${
        isPresentationMode
          ? 'max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8 min-h-screen'
          : ''
      }`}
    >
      {/* Header / Presentation Bar */}
      {isPresentationMode && canUsePresentation ? (
        <div className="rounded-2xl bg-[#1E5631] dark:bg-[#1B2E22] text-white border border-[#18472A] dark:border-[#2F5A3F] p-5 sm:p-7">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FEF0D4] text-xs font-bold uppercase tracking-wider">
                <Presentation className="w-3.5 h-3.5" />
                <span>Chế độ trình chiếu Zoom</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {uiSettings.appName} —{' '}
                {currentWeek?.label ?? `Tuần ${selectedWeek}`}
              </h1>
              {currentWeek && (
                <p className="text-white/85 text-base sm:text-lg font-medium tabular-nums">
                  {currentWeek.topic} ({formatDateVN(currentWeek.startDate)} –{' '}
                  {formatDateVN(currentWeek.endDate)})
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <DisplayControls variant="inverted" compact />

              <select
                aria-label="Chọn tuần trình chiếu"
                value={selectedWeek}
                onChange={(e) => onSelectWeek(Number(e.target.value))}
                className="h-10 px-3.5 rounded-xl bg-white/15 hover:bg-white/20 text-white border border-white/25 font-bold text-sm cursor-pointer"
              >
                {weeks.map((w) => (
                  <option
                    key={w.weekNumber}
                    value={w.weekNumber}
                    className="bg-surface text-slate-900"
                  >
                    {w.label}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/20">
                {[
                  { id: 'all', label: 'Toàn cảnh' },
                  { id: 'overview', label: 'KPI & 4 Nhóm' },
                  { id: 'members', label: 'Danh sách cá nhân' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFocusView(opt.id as PresentationFocus)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                      focusView === opt.id
                        ? 'bg-white text-[#1E5631]'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setFocusView('all');
                  onTogglePresentation(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEF0D4] hover:bg-[#FDDFA5] text-[#1C1917] font-extrabold text-sm transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Thoát trình chiếu (Esc)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Báo cáo tuần
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {currentWeek
                ? `${currentWeek.label}${currentWeek.topic ? `: ${currentWeek.topic}` : ''}`
                : `Tuần ${selectedWeek}`}
            </h1>
            {currentWeek && (
              <p className="text-sm text-slate-500 mt-1 tabular-nums">
                {formatDateVN(currentWeek.startDate)} –{' '}
                {formatDateVN(currentWeek.endDate)} •{' '}
                {currentWeek.studyDates.length} buổi học • {stats.totalMembers}{' '}
                thành viên hoạt động
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0 w-full sm:w-auto">
              <label
                htmlFor="dashboard-week-select"
                className="text-sm font-semibold text-slate-600 shrink-0"
              >
                Tuần học:
              </label>
              <select
                id="dashboard-week-select"
                value={selectedWeek}
                onChange={(e) => onSelectWeek(Number(e.target.value))}
                className="w-full sm:w-auto max-w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm sm:text-base min-h-[44px]"
              >
                {weeks.map((w) => (
                  <option key={w.weekNumber} value={w.weekNumber}>
                    {w.label}
                    {w.topic ? ` — ${w.topic}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Chỉ hiện với admin & banhoctap, và ẩn hoàn toàn trên màn hình điện thoại (< 768px) */}
            {canUsePresentation && (
              <button
                type="button"
                onClick={() => onTogglePresentation(true)}
                className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm min-h-[44px] transition-all"
              >
                <Presentation className="w-4 h-4" />
                <span>Chế độ Trình chiếu Zoom</span>
                <Maximize2 className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state if week has 0 logs */}
      {stats.totalLogs === 0 && (
        <div className="bg-surface rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
          <h2 className="text-lg font-bold text-slate-800">
            Chưa có dữ liệu điểm danh cho{' '}
            {currentWeek?.label ?? `Tuần ${selectedWeek}`}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg mx-auto">
            Số liệu sẽ tự động cập nhật ngay khi cán sự chấm điểm ở tab Sổ Theo Dõi Ngày.
          </p>
        </div>
      )}

      {/* 4 KPI Cards + Tổng kết 4 nhóm (Clickable Cards) */}
      {showOverview && (
        <>
          <KpiCards
            stats={stats}
            showPercentage={uiSettings.showPercentage}
            presentationMode={isPresentationMode}
          />

          {uiSettings.showGroupSummary ? (
            <GroupSummaryGrid
              summaries={visibleGroupSummaries}
              groupNames={uiSettings.groupNames}
              showPercentage={uiSettings.showPercentage}
              restrictedSingleGroup={Boolean(visibleGroupFilter)}
              presentationMode={isPresentationMode}
              canClickGroup={canClickGroup}
              onSelectGroup={handleSelectGroupCard}
            />
          ) : isAdmin ? (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs sm:text-sm text-slate-600">
              Phần <strong>Tổng kết 4 nhóm</strong> đang được tắt trong mục{' '}
              <em>Cấu hình Giao diện &amp; Hiển thị</em> (Tab Quản Lý Lớp).
            </div>
          ) : null}
        </>
      )}

      {/* Danh sách chi tiết cá nhân: CHỈ hiển thị cho admin và banhoctap */}
      {showMembers && (
        <MemberDetailsBoard
          qualifiedByGroup={stats.qualifiedByGroup}
          totalQualified={stats.qualifiedCount}
          attentionList={stats.attentionList}
          groupNames={uiSettings.groupNames}
          weekLabel={currentWeek?.label ?? `Tuần ${selectedWeek}`}
          presentationMode={isPresentationMode}
        />
      )}

      {/* Modal Chi Tiết Nhóm & Góc Trình Bày Vấn Đề Nhóm */}
      <GroupDetailModal
        isOpen={Boolean(detailGroup)}
        group={detailGroup}
        week={currentWeek}
        members={members}
        logs={logs}
        groupNames={uiSettings.groupNames}
        presentationNote={activeGroupNote}
        canEditPresentationNote={canViewIndividualDetails}
        onSavePresentationNote={(weekNumber, groupId, note) => {
          onSaveGroupNote(weekNumber, groupId, note);
          onNotify('Đã lưu ghi chú trình bày cho nhóm!');
        }}
        onClose={() => setDetailGroup(null)}
      />
    </div>
  );
};
