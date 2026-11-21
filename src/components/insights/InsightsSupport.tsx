import React, { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import {
  DailyLog,
  getGroupDisplayName,
  GROUP_META,
  GROUPS,
  GroupId,
  Member,
  WeekConfig,
} from '../../types';
import {
  computeWeeklyInsights,
  formatDateVN,
  formatShortDateVN,
} from '../../utils/analytics';
import { copyTextToClipboard } from '../../utils/zaloReport';

interface InsightsSupportProps {
  members: Member[];
  logs: DailyLog[];
  weeks: WeekConfig[];
  selectedWeek: number;
  groupNames: Record<GroupId, string>;
  onSelectWeek: (weekNumber: number) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

export const InsightsSupport: React.FC<InsightsSupportProps> = ({
  members,
  logs,
  weeks,
  selectedWeek,
  groupNames,
  onSelectWeek,
  onNotify,
}) => {
  const [groupFilter, setGroupFilter] = useState<'ALL' | GroupId>('ALL');

  const currentWeek = useMemo(
    () => weeks.find((w) => w.weekNumber === selectedWeek) ?? weeks[0],
    [weeks, selectedWeek]
  );

  const insights = useMemo(
    () =>
      computeWeeklyInsights(
        members,
        logs,
        selectedWeek,
        currentWeek?.studyDates
      ),
    [members, logs, selectedWeek, currentWeek]
  );

  const filteredHighlights = useMemo(() => {
    return insights.highlights.filter((item) => {
      if (groupFilter !== 'ALL' && item.member.group !== groupFilter) {
        return false;
      }
      return true;
    });
  }, [insights.highlights, groupFilter]);

  const filteredSupport = useMemo(() => {
    return insights.supportNeeded.filter((item) => {
      if (groupFilter !== 'ALL' && item.member.group !== groupFilter) {
        return false;
      }
      return true;
    });
  }, [insights.supportNeeded, groupFilter]);

  const handleCopyMcStories = async () => {
    if (filteredHighlights.length === 0) {
      onNotify('Chưa có tư liệu điểm sáng để sao chép.', 'info');
      return;
    }

    const lines = filteredHighlights.map((item, index) => {
      return `${index + 1}. ${item.member.fullName} (${getGroupDisplayName(item.member.group, groupNames)} - ${formatShortDateVN(item.log.date)}): ${item.log.homeworkFeedback.trim()}`;
    });

    const header = `TƯ LIỆU ĐIỂM SÁNG ${currentWeek?.label.toUpperCase() ?? `TUẦN ${selectedWeek}`}${currentWeek?.topic ? ` - ${currentWeek.topic}` : ''}\n`;
    const ok = await copyTextToClipboard(`${header}\n${lines.join('\n')}`);
    if (ok) {
      onNotify(
        `Đã sao chép ${filteredHighlights.length} câu chuyện điểm sáng cho MC đọc trên Zoom!`
      );
    } else {
      onNotify('Trình duyệt không hỗ trợ sao chép tự động.', 'info');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Tư liệu MC &amp; Đồng hành học viên
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              Điểm Sáng &amp; Đồng Hành
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng hợp nhận xét bài tập từ Sổ Theo Dõi Ngày và danh sách học viên cần hỏi thăm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              aria-label="Chọn tuần xem điểm sáng"
              value={selectedWeek}
              onChange={(e) => onSelectWeek(Number(e.target.value))}
              className="w-full sm:w-auto max-w-full min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm sm:text-base"
            >
              {weeks.map((w) => (
                <option key={w.weekNumber} value={w.weekNumber}>
                  {w.label}
                  {w.topic ? ` — ${w.topic}` : ''}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                  groupFilter === 'ALL'
                    ? 'bg-surface text-slate-900 border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                Cả lớp
              </button>
              {GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                    groupFilter === g
                      ? 'bg-surface text-emerald-800 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {getGroupDisplayName(g, groupNames)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two Main Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Góc Điểm Sáng (tự động từ Nhận xét & Đánh giá bài theo cảm xúc) */}
        <section className="xl:col-span-7 bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                Góc Điểm Sáng ({filteredHighlights.length})
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Các nhận xét cảm xúc về bài đúc kết để MC chia sẻ khi họp Zoom
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyMcStories}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-colors shrink-0"
            >
              <Copy className="w-4 h-4" />
              <span>Sao chép tư liệu MC</span>
            </button>
          </div>

          {filteredHighlights.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-8 text-center">
              <p className="text-sm sm:text-base font-medium text-slate-500">
                Chưa có nhận xét điểm sáng nào trong {currentWeek?.label}. Cán sự có thể nhập ở ô “Nhận xét &amp; Đánh giá bài” tại Sub-tab Chấm Bài Tối.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHighlights.map(({ log, member }) => {
                const meta = GROUP_META[member.group];
                return (
                  <article
                    key={log.id}
                    className="rounded-xl border border-amber-200 bg-amber-50/45 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {member.fullName}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                        >
                          {getGroupDisplayName(member.group, groupNames)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500 tabular-nums">
                        {formatDateVN(log.date)}
                      </span>
                    </div>

                    <p className="text-sm sm:text-[15px] text-slate-800 leading-relaxed">
                      “{log.homeworkFeedback.trim()}”
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Góc Cần Trợ Lực (Support Needed) */}
        <section className="xl:col-span-5 bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              Góc Cần Trợ Lực ({filteredSupport.length})
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Thành viên có từ 2 lượt vắng / muộn / thiếu bài để nhóm hỏi thăm
            </p>
          </div>

          {filteredSupport.length === 0 ? (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-8 text-center">
              <p className="text-sm sm:text-base font-semibold text-emerald-800">
                Hiện không có thành viên nào cần trợ lực thêm trong phạm vi đang lọc.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSupport.map((item) => {
                const meta = GROUP_META[item.member.group];
                return (
                  <article
                    key={item.member.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {item.member.fullName}
                          </h3>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                          >
                            {getGroupDisplayName(item.member.group, groupNames)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">
                          {item.member.role}
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tabular-nums">
                        {item.totalSlips} lượt lưu ý
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-xs font-bold tabular-nums">
                      {item.absentCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                          Vắng: {item.absentCount}
                        </span>
                      )}
                      {item.lateCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          Vào muộn: {item.lateCount}
                        </span>
                      )}
                      {item.homeworkSlipCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                          Bài tập chưa đúng hạn: {item.homeworkSlipCount}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      {item.entries.map((entry) => (
                        <div
                          key={entry.date}
                          className="rounded-lg bg-surface border border-slate-200 p-3 text-xs sm:text-sm space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-slate-800">
                            <span className="tabular-nums">
                              Ngày {formatShortDateVN(entry.date)}
                            </span>
                            <span className="text-slate-500 font-medium">
                              {entry.attendance} • Bài: {entry.homework}
                            </span>
                          </div>
                          {entry.morningNote && (
                            <p className="text-amber-900 leading-relaxed">
                              <span className="font-semibold">Sáng:</span>{' '}
                              {entry.morningNote}
                            </p>
                          )}
                          {entry.generalNote && (
                            <p className="text-slate-600 leading-relaxed">
                              <span className="font-semibold">Ghi chú:</span>{' '}
                              {entry.generalNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
