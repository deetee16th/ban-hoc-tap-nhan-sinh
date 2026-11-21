import React from 'react';
import { usePreferences } from '../../context/PreferencesContext';
import { WeeklyDashboardStats } from '../../utils/analytics';

interface KpiCardsProps {
  stats: WeeklyDashboardStats;
  showPercentage: boolean;
  presentationMode?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  stats,
  showPercentage,
  presentationMode = false,
}) => {
  const { fontScale } = usePreferences();
  const isLargeFont = fontScale === 'large';

  const mainValueClass = presentationMode
    ? 'text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums'
    : isLargeFont
      ? 'text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums'
      : 'text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums';

  const titleClass = presentationMode
    ? 'text-base font-bold text-slate-800 leading-snug'
    : 'text-xs sm:text-sm font-bold text-slate-800 leading-snug';

  const mobileGridClass = isLargeFont
    ? 'grid-cols-1 gap-2.5'
    : 'grid-cols-2 gap-2.5';

  const cards = [
    {
      key: 'qualified',
      title: 'Đạt chuẩn cả tuần',
      subtitle: 'Đủ buổi, đúng giờ, bật cam & nộp bài',
      primary: showPercentage
        ? `${stats.qualifiedRate}%`
        : `${stats.qualifiedCount}/${stats.totalMembers} người`,
      secondary: showPercentage
        ? `${stats.qualifiedCount}/${stats.totalMembers} người`
        : `${stats.qualifiedRate}%`,
      percent: stats.qualifiedRate,
      dotClass: 'bg-emerald-600',
      valueClass: 'text-emerald-700',
      trackClass: 'bg-emerald-100',
      barClass: 'bg-emerald-600',
    },
    {
      key: 'onTime',
      title: 'Vào lớp đúng giờ',
      subtitle: 'Số lượt vào lớp đúng giờ quy định',
      primary: showPercentage
        ? `${stats.onTimeRate}%`
        : `${stats.onTimeCount}/${stats.attendanceGradedCount} lượt`,
      secondary: showPercentage
        ? `${stats.onTimeCount}/${stats.attendanceGradedCount} lượt`
        : `${stats.onTimeRate}%`,
      percent: stats.onTimeRate,
      dotClass: 'bg-teal-600',
      valueClass: 'text-teal-700',
      trackClass: 'bg-teal-100',
      barClass: 'bg-teal-600',
    },
    {
      key: 'camera',
      title: 'Bật camera',
      subtitle: 'Số lượt mở cam trong các buổi học',
      primary: showPercentage
        ? `${stats.cameraRate}%`
        : `${stats.cameraOnCount}/${stats.attendedCount} lượt`,
      secondary: showPercentage
        ? `${stats.cameraOnCount}/${stats.attendedCount} lượt`
        : `${stats.cameraRate}%`,
      percent: stats.cameraRate,
      dotClass: 'bg-sky-600',
      valueClass: 'text-sky-700',
      trackClass: 'bg-sky-100',
      barClass: 'bg-sky-600',
    },
    {
      key: 'homework',
      title: 'Nộp bài tập',
      subtitle: 'Số bài thu hoạch nộp đúng hạn',
      primary: showPercentage
        ? `${stats.homeworkRate}%`
        : `${stats.homeworkOnTimeCount}/${stats.homeworkGradedCount} bài`,
      secondary: showPercentage
        ? `${stats.homeworkOnTimeCount}/${stats.homeworkGradedCount} bài`
        : `${stats.homeworkRate}%`,
      percent: stats.homeworkRate,
      dotClass: 'bg-amber-600',
      valueClass: 'text-amber-700',
      trackClass: 'bg-amber-100',
      barClass: 'bg-amber-600',
    },
  ];

  return (
    <div
      className={`grid ${mobileGridClass} sm:grid-cols-2 xl:grid-cols-4 sm:gap-4`}
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className="bg-surface rounded-2xl border border-slate-200 p-3.5 sm:p-5 flex flex-col justify-between min-w-0"
        >
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                aria-hidden="true"
                className={`w-2 h-2 rounded-full shrink-0 ${card.dotClass}`}
              />
              <p className={titleClass}>{card.title}</p>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2">
              {card.subtitle}
            </p>
          </div>

          <div className="mt-3.5 sm:mt-5">
            <div className="flex items-baseline justify-between flex-wrap gap-x-2 gap-y-0.5">
              <span className={`${mainValueClass} ${card.valueClass}`}>
                {card.primary}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 tabular-nums">
                {card.secondary}
              </span>
            </div>
            <div
              className={`mt-2.5 sm:mt-3 h-1.5 rounded-full overflow-hidden ${card.trackClass}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${card.barClass}`}
                style={{ width: `${card.percent}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
