import React from 'react';
import {
  getGroupDisplayName,
  GROUP_META,
  GROUPS,
  GroupId,
  Member,
} from '../../types';
import { formatShortDateVN, MemberAttentionItem } from '../../utils/analytics';

interface MemberDetailsBoardProps {
  qualifiedByGroup: Record<GroupId, Member[]>;
  totalQualified: number;
  attentionList: MemberAttentionItem[];
  groupNames: Record<GroupId, string>;
  weekLabel: string;
  presentationMode?: boolean;
}

export const MemberDetailsBoard: React.FC<MemberDetailsBoardProps> = ({
  qualifiedByGroup,
  totalQualified,
  attentionList,
  groupNames,
  weekLabel,
  presentationMode = false,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Danh sách Đạt chuẩn cả tuần */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="mb-5">
          <h2
            className={`font-extrabold text-slate-900 tracking-tight tabular-nums ${
              presentationMode ? 'text-2xl sm:text-3xl' : 'text-xl'
            }`}
          >
            Danh sách đạt chuẩn cả tuần ({totalQualified})
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Các thành viên đi học đủ, đúng giờ, bật camera và nộp bài đầy đủ trong {weekLabel}
          </p>
        </div>

        {totalQualified === 0 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-sm text-slate-500">
            Chưa có thành viên đạt chuẩn trong {weekLabel}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {GROUPS.map((groupId) => {
              const meta = GROUP_META[groupId];
              const groupMembers = qualifiedByGroup[groupId] ?? [];
              const displayName = getGroupDisplayName(groupId, groupNames);

              return (
                <div
                  key={groupId}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                    >
                      {displayName}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 tabular-nums">
                      {groupMembers.length} người
                    </span>
                  </div>

                  {groupMembers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center">
                      Chưa có
                    </p>
                  ) : (
                    <ul className="space-y-1.5 flex-1">
                      {groupMembers.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface border border-slate-200"
                        >
                          <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-semibold text-slate-900 truncate ${
                                presentationMode ? 'text-base' : 'text-sm'
                              }`}
                            >
                              {member.fullName}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Danh sách Cần lưu ý / Sát sao (hiển thị trực tiếp Ghi chú buổi sáng & ghi chú chung) */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="mb-5">
          <h2
            className={`font-extrabold text-slate-900 tracking-tight tabular-nums ${
              presentationMode ? 'text-2xl sm:text-3xl' : 'text-xl'
            }`}
          >
            Danh sách cần lưu ý / sát sao ({attentionList.length})
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Thành viên có buổi vào muộn, vắng, tắt cam hoặc nộp bài chưa đúng hạn trong {weekLabel}
          </p>
        </div>

        {attentionList.length === 0 ? (
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-6 text-center text-sm font-semibold text-emerald-800">
            Cả lớp đều hoàn thành đầy đủ trong {weekLabel}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {attentionList.map((item) => {
              const meta = GROUP_META[item.member.group];
              const displayName = getGroupDisplayName(
                item.member.group,
                groupNames
              );

              return (
                <div
                  key={item.member.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-bold text-slate-900 truncate ${
                          presentationMode ? 'text-lg' : 'text-base'
                        }`}
                      >
                        {item.member.fullName}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        {displayName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs font-bold tabular-nums">
                    {item.absentCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                        Vắng: {item.absentCount}
                      </span>
                    )}
                    {item.lateCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                        Muộn giờ: {item.lateCount}
                      </span>
                    )}
                    {item.cameraOffCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800">
                        Tắt cam: {item.cameraOffCount}
                      </span>
                    )}
                    {item.homeworkMissingCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-900 border border-orange-200">
                        Chưa nộp bài: {item.homeworkMissingCount}
                      </span>
                    )}
                    {item.homeworkLateCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
                        Nộp bài muộn: {item.homeworkLateCount}
                      </span>
                    )}
                  </div>

                  {/* Hiển thị trực tiếp Ghi chú buổi sáng & ghi chú theo ngày */}
                  {item.entries.some(
                    (e) => e.morningNote.length > 0 || e.generalNote.length > 0
                  ) && (
                    <div className="space-y-1.5 pt-1">
                      {item.entries
                        .filter(
                          (e) =>
                            e.morningNote.length > 0 || e.generalNote.length > 0
                        )
                        .map((entry) => (
                          <div
                            key={entry.date}
                            className="text-xs sm:text-sm bg-surface border border-slate-200 rounded-lg px-3 py-2 space-y-0.5"
                          >
                            {entry.morningNote && (
                              <p className="text-amber-950 leading-relaxed">
                                <span className="font-bold tabular-nums">
                                  Sáng {formatShortDateVN(entry.date)}:
                                </span>{' '}
                                {entry.morningNote}
                              </p>
                            )}
                            {entry.generalNote && (
                              <p className="text-slate-600 leading-relaxed">
                                <span className="font-bold tabular-nums">
                                  Ghi chú {formatShortDateVN(entry.date)}:
                                </span>{' '}
                                {entry.generalNote}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
