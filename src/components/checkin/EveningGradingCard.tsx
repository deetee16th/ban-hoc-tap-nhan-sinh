import React from 'react';
import {
  DailyLog,
  HOMEWORK_OPTIONS,
  HomeworkButtonOption,
  Member,
} from '../../types';
import { isLogEveningPerfect } from '../../utils/analytics';

interface EveningGradingCardProps {
  member: Member;
  log: DailyLog | undefined;
  date: string;
  weekNumber: number;
  onChangeLog: (nextLog: DailyLog) => void;
}

const HOMEWORK_ACTIVE_STYLE: Record<HomeworkButtonOption, string> = {
  'Đúng hạn': 'bg-emerald-600 text-white border-emerald-600',
  Muộn: 'bg-amber-500 text-white border-amber-500',
  'Muộn CP': 'bg-sky-600 text-white border-sky-600',
  'Chưa nộp': 'bg-orange-500 text-white border-orange-500',
  'Không nộp': 'bg-rose-600 text-white border-rose-600',
};

function getMorningSummaryBadge(log: DailyLog): {
  text: string;
  toneClass: string;
} {
  if (log.attendance === 'Chưa chấm' && log.camera === 'Chưa chấm') {
    return {
      text: 'Sáng: Chưa điểm danh',
      toneClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const camText =
    log.camera === 'Có'
      ? 'Có cam'
      : log.camera === 'Không'
        ? 'Không cam'
        : 'Chưa chấm cam';

  if (log.attendance === 'Vắng' || log.attendance === 'Vắng CP') {
    return {
      text: `Sáng: ${log.attendance}`,
      toneClass: 'bg-sky-50 text-sky-800 border-sky-200',
    };
  }

  if (log.attendance === 'Đúng giờ' && log.camera === 'Có') {
    return {
      text: 'Sáng: Đúng giờ • Có cam',
      toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  const attText =
    log.attendance === 'Chưa chấm' ? 'Chưa chấm giờ' : log.attendance;
  return {
    text: `Sáng: ${attText} • ${camText}`,
    toneClass: 'bg-amber-50 text-amber-900 border-amber-200',
  };
}

export const EveningGradingCard: React.FC<EveningGradingCardProps> = ({
  member,
  log,
  date,
  weekNumber,
  onChangeLog,
}) => {
  const current: DailyLog = log ?? {
    id: `log-${date}-${member.id}`,
    date,
    weekNumber,
    memberId: member.id,
    attendance: 'Chưa chấm',
    homework: 'Chưa chấm',
    camera: 'Chưa chấm',
    morningNote: '',
    homeworkFeedback: '',
    generalNote: '',
  };

  const hasHomework = current.homework !== 'Chưa chấm';
  const eveningPerfect = hasHomework && isLogEveningPerfect(current);
  const morningBadge = getMorningSummaryBadge(current);

  const handleHomeworkSelect = (homework: HomeworkButtonOption) => {
    onChangeLog({
      ...current,
      homework,
    });
  };

  const handleFeedbackChange = (homeworkFeedback: string) => {
    onChangeLog({
      ...current,
      homeworkFeedback,
    });
  };

  const handleGeneralNoteChange = (generalNote: string) => {
    onChangeLog({
      ...current,
      generalNote,
    });
  };

  return (
    <article
      className={`bg-surface rounded-2xl border p-4 sm:p-6 transition-colors ${
        !hasHomework
          ? 'border-slate-200'
          : eveningPerfect
            ? 'border-emerald-200'
            : 'border-amber-300'
      }`}
    >
      {/* Card Header + Morning Reminder Badge */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
            {member.stt}
          </span>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
              {member.fullName}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              {member.role}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${morningBadge.toneClass}`}
          >
            {morningBadge.text}
          </span>

          {!hasHomework ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Chưa chấm bài
            </span>
          ) : eveningPerfect ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              Đúng hạn
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
              Cần lưu ý
            </span>
          )}
        </div>
      </div>

      {/* Nhắc ghi chú sáng nếu có */}
      {current.morningNote.trim().length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-2 text-xs sm:text-sm text-amber-950">
          <span className="font-bold">Ghi chú sáng:</span> {current.morningNote}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* 1. Bài tập đúc kết */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            1. Bài tập đúc kết
          </div>
          <div className="flex flex-wrap gap-2">
            {HOMEWORK_OPTIONS.map((hwOption) => {
              const active = current.homework === hwOption;
              return (
                <button
                  key={hwOption}
                  type="button"
                  onClick={() => handleHomeworkSelect(hwOption)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                    active
                      ? HOMEWORK_ACTIVE_STYLE[hwOption]
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {hwOption}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Nhận xét & Đánh giá bài (theo cảm xúc -> tự động đổ sang Điểm Sáng) */}
        <div>
          <label
            htmlFor={`feedback-${member.id}`}
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            2. Nhận xét &amp; Đánh giá bài (theo cảm xúc — đưa sang mục Điểm Sáng)
          </label>
          <textarea
            id={`feedback-${member.id}`}
            rows={2}
            value={current.homeworkFeedback}
            onChange={(e) => handleFeedbackChange(e.target.value)}
            placeholder="Viết cảm nhận chân thành về sự chuyển hóa hoặc điểm chạm trong bài đúc kết của học viên..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/40 focus:bg-surface border border-amber-200 focus:border-amber-500 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors resize-y"
          />
        </div>

        {/* 3. Ghi chú thông thường */}
        <div>
          <label
            htmlFor={`general-note-${member.id}`}
            className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
          >
            3. Ghi chú thông thường
          </label>
          <input
            id={`general-note-${member.id}`}
            type="text"
            value={current.generalNote}
            onChange={(e) => handleGeneralNoteChange(e.target.value)}
            placeholder="VD: Lỗi mạng gửi bù qua Zalo, xin nộp muộn có phép..."
            className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 focus:border-emerald-600 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </div>
    </article>
  );
};
