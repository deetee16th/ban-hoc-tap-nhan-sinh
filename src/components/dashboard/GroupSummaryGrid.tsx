import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getGroupDisplayName, GROUP_META, GroupId } from '../../types';
import { GroupSummaryItem } from '../../utils/analytics';

interface GroupSummaryGridProps {
  summaries: GroupSummaryItem[];
  groupNames: Record<GroupId, string>;
  showPercentage: boolean;
  restrictedSingleGroup?: boolean;
  presentationMode?: boolean;
  canClickGroup: (group: GroupId) => boolean;
  onSelectGroup: (group: GroupId) => void;
}

export const GroupSummaryGrid: React.FC<GroupSummaryGridProps> = ({
  summaries,
  groupNames,
  showPercentage,
  restrictedSingleGroup = false,
  presentationMode = false,
  canClickGroup,
  onSelectGroup,
}) => {
  return (
    <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6">
      <div className="mb-5">
        <h2
          className={`font-extrabold text-slate-900 tracking-tight ${
            presentationMode ? 'text-2xl sm:text-3xl' : 'text-xl'
          }`}
        >
          {restrictedSingleGroup
            ? 'Tổng kết nhóm phụ trách'
            : 'Tổng kết 4 nhóm'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Số thành viên hoàn thành đầy đủ từng tiêu chí trong tuần
        </p>
      </div>

      <div
        className={`grid gap-4 ${
          summaries.length === 1
            ? 'grid-cols-1 max-w-md'
            : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
        }`}
      >
        {summaries.map((item) => {
          const meta = GROUP_META[item.group];
          const displayName = getGroupDisplayName(item.group, groupNames);
          const clickable = canClickGroup(item.group);

          return (
            <button
              key={item.group}
              type="button"
              onClick={() => onSelectGroup(item.group)}
              className={`text-left rounded-xl border p-4 sm:p-5 space-y-4 transition-all flex flex-col justify-between ${
                clickable
                  ? 'border-slate-200 bg-slate-50/70 hover:bg-surface hover:border-emerald-600 cursor-pointer'
                  : 'border-slate-200 bg-slate-50/50 cursor-default'
              }`}
            >
              <div className="w-full space-y-4">
                {/* Group Name & Headcount */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <span
                    className={`px-2.5 py-1 rounded-lg border font-bold ${
                      presentationMode ? 'text-base' : 'text-sm'
                    } ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                  >
                    {displayName}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-500 tabular-nums">
                    {item.memberCount} thành viên
                  </span>
                </div>

                {/* 3 Practical Metrics */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-sm sm:text-[15px]">
                    <span className="text-slate-600 font-medium">Đúng giờ</span>
                    <span
                      className={`font-extrabold text-slate-900 tabular-nums ${
                        presentationMode ? 'text-lg' : 'text-base'
                      }`}
                    >
                      {showPercentage
                        ? `${item.onTimeMemberRate}%`
                        : `${item.onTimeMemberCount}/${item.memberCount}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm sm:text-[15px]">
                    <span className="text-slate-600 font-medium">Mở cam</span>
                    <span
                      className={`font-extrabold text-slate-900 tabular-nums ${
                        presentationMode ? 'text-lg' : 'text-base'
                      }`}
                    >
                      {showPercentage
                        ? `${item.cameraOnMemberRate}%`
                        : `${item.cameraOnMemberCount}/${item.memberCount}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm sm:text-[15px]">
                    <span className="text-slate-600 font-medium">Nộp bài</span>
                    <span
                      className={`font-extrabold text-slate-900 tabular-nums ${
                        presentationMode ? 'text-lg' : 'text-base'
                      }`}
                    >
                      {showPercentage
                        ? `${item.homeworkOnTimeMemberRate}%`
                        : `${item.homeworkOnTimeMemberCount}/${item.memberCount}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer hint */}
              {clickable && (
                <div className="w-full pt-3 border-t border-slate-200 flex items-center justify-between gap-1 text-xs font-semibold text-emerald-700">
                  <span>Xem chi tiết tuần &amp; ghi chú trình bày</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
