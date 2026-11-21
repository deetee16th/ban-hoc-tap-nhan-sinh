import React, { useMemo, useState } from 'react';
import { Check, Edit3, Plus, X } from 'lucide-react';
import { WeekConfig } from '../../types';
import {
  addDaysToIsoDate,
  enumerateDatesInRange,
  formatDateVN,
  formatShortDateVN,
  getWeekdayVN,
  isSundayIsoDate,
} from '../../utils/analytics';

interface WeekManagerSectionProps {
  weeks: WeekConfig[];
  selectedWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  onSaveWeek: (week: WeekConfig) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

export const WeekManagerSection: React.FC<WeekManagerSectionProps> = ({
  weeks,
  selectedWeek,
  onSelectWeek,
  onSaveWeek,
  onNotify,
}) => {
  const [editorMode, setEditorMode] = useState<'closed' | 'create' | 'edit'>(
    'closed'
  );
  const [editingWeekNumber, setEditingWeekNumber] = useState<number>(1);
  const [label, setLabel] = useState('');
  const [topic, setTopic] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [error, setError] = useState('');

  const nextWeekNumber = useMemo(() => {
    return weeks.reduce((max, w) => Math.max(max, w.weekNumber), 0) + 1;
  }, [weeks]);

  const dateRangeCandidates = useMemo(
    () => enumerateDatesInRange(startDate, endDate, 45),
    [startDate, endDate]
  );

  const openCreateForm = () => {
    const latestWeek = weeks[weeks.length - 1];
    const defaultStart = latestWeek
      ? addDaysToIsoDate(latestWeek.endDate, 1)
      : '2026-11-16';
    const defaultEnd = addDaysToIsoDate(defaultStart, 6);
    const candidates = enumerateDatesInRange(defaultStart, defaultEnd);
    const defaultStudyDates = candidates.filter((d) => !isSundayIsoDate(d));

    setEditingWeekNumber(nextWeekNumber);
    setLabel(`Tuần ${nextWeekNumber}`);
    setTopic('');
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setSelectedDates(
      defaultStudyDates.length > 0 ? defaultStudyDates : candidates
    );
    setError('');
    setEditorMode('create');
  };

  const openEditForm = (week: WeekConfig) => {
    setEditingWeekNumber(week.weekNumber);
    setLabel(week.label);
    setTopic(week.topic);
    setStartDate(week.startDate);
    setEndDate(week.endDate);
    setSelectedDates([...week.studyDates]);
    setError('');
    setEditorMode('edit');
  };

  const handleDateRangeChange = (nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setError('');

    const candidates = enumerateDatesInRange(nextStart, nextEnd, 45);
    if (candidates.length === 0) {
      setSelectedDates([]);
      return;
    }

    // Giữ lại các ngày đã chọn nằm trong khoảng mới; nếu chưa có ngày nào khớp thì mặc định bỏ Chủ Nhật
    const candidateSet = new Set(candidates);
    const preserved = selectedDates.filter((d) => candidateSet.has(d));
    if (preserved.length > 0) {
      setSelectedDates(preserved);
    } else {
      const nonSundays = candidates.filter((d) => !isSundayIsoDate(d));
      setSelectedDates(nonSundays.length > 0 ? nonSundays : candidates);
    }
  };

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date].sort((a, b) => a.localeCompare(b))
    );
    if (error) setError('');
  };

  const handleSelectAllDates = () => {
    setSelectedDates(dateRangeCandidates);
    if (error) setError('');
  };

  const handleSelectNoSunday = () => {
    setSelectedDates(dateRangeCandidates.filter((d) => !isSundayIsoDate(d)));
    if (error) setError('');
  };

  const handleClearAllDates = () => {
    setSelectedDates([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Vui lòng nhập tên tuần học (VD: Tuần 3).');
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
      return;
    }
    if (selectedDates.length === 0) {
      setError('Vui lòng tick chọn ít nhất 1 ngày có buổi học trong tuần.');
      return;
    }

    const saved: WeekConfig = {
      weekNumber: editingWeekNumber,
      label: label.trim(),
      topic: topic.trim(),
      startDate,
      endDate,
      studyDates: [...selectedDates].sort((a, b) => a.localeCompare(b)),
    };

    onSaveWeek(saved);
    onSelectWeek(saved.weekNumber);
    setEditorMode('closed');
    onNotify(
      editorMode === 'edit'
        ? `Đã cập nhật lịch học cho ${saved.label} (${saved.studyDates.length} buổi).`
        : `Đã tạo ${saved.label} với ${saved.studyDates.length} buổi học!`
    );
  };

  return (
    <section className="xl:col-span-7 bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Tuần học linh hoạt
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Chọn khoảng ngày bất kỳ và tick các ngày có buổi học thực tế
          </p>
        </div>

        {editorMode === 'closed' && (
          <button
            type="button"
            onClick={openCreateForm}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tuần mới</span>
          </button>
        )}
      </div>

      {/* Danh sách tuần hiện có */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const isCurrent = week.weekNumber === selectedWeek;
          return (
            <div
              key={week.weekNumber}
              className={`rounded-xl border p-4 space-y-2.5 ${
                isCurrent
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm sm:text-base">
                    {week.label}
                    {week.topic ? `: ${week.topic}` : ''}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Khoảng thời gian: {formatDateVN(week.startDate)} –{' '}
                    {formatDateVN(week.endDate)} •{' '}
                    <strong className="text-slate-700">
                      {week.studyDates.length} buổi học
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditForm(week)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-surface hover:bg-slate-100 border border-slate-200 text-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa lịch</span>
                  </button>

                  {isCurrent ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white">
                      Đang xem
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectWeek(week.weekNumber)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Chọn tuần
                    </button>
                  )}
                </div>
              </div>

              {/* Preview các ngày học đã chọn */}
              <div className="flex flex-wrap gap-1.5">
                {week.studyDates.map((d) => (
                  <span
                    key={d}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-slate-200 text-[11px] font-bold text-slate-700 tabular-nums"
                  >
                    {getWeekdayVN(d)} {formatShortDateVN(d)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Tạo mới / Chỉnh sửa Tuần học */}
      {editorMode !== 'closed' && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-sky-50/50 border border-sky-200 p-4 sm:p-5 space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-slate-900">
              {editorMode === 'edit'
                ? `Chỉnh sửa ${label}`
                : `Tạo tuần học mới (Tuần ${editingWeekNumber})`}
            </h3>
            <button
              type="button"
              onClick={() => setEditorMode('closed')}
              aria-label="Đóng biểu mẫu tuần"
              className="tap-compact p-1.5 rounded-lg text-slate-500 hover:bg-surface hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="week-label-input"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Tên tuần *
              </label>
              <input
                id="week-label-input"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VD: Tuần 3"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-surface border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="week-topic-input"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Chủ đề tuần (tùy chọn)
              </label>
              <input
                id="week-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Thực hành lắng nghe & kỷ luật đều đặn"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-surface border border-slate-300 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="week-start-input"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Ngày bắt đầu (startDate) *
              </label>
              <input
                id="week-start-input"
                type="date"
                value={startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-surface border border-slate-300 text-sm font-semibold text-slate-900 tabular-nums"
              />
            </div>
            <div>
              <label
                htmlFor="week-end-input"
                className="block text-xs font-bold text-slate-600 mb-1"
              >
                Ngày kết thúc (endDate) *
              </label>
              <input
                id="week-end-input"
                type="date"
                value={endDate}
                onChange={(e) =>
                  handleDateRangeChange(startDate, e.target.value)
                }
                className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-surface border border-slate-300 text-sm font-semibold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Checkbox các ngày trong khoảng thời gian */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 tabular-nums">
                Tick chọn các ngày có buổi học ({selectedDates.length}/
                {dateRangeCandidates.length} ngày):
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllDates}
                  className="tap-compact px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleSelectNoSunday}
                  className="tap-compact px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700"
                >
                  Bỏ Chủ Nhật
                </button>
                <button
                  type="button"
                  onClick={handleClearAllDates}
                  className="tap-compact px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-500"
                >
                  Bỏ chọn hết
                </button>
              </div>
            </div>

            {dateRangeCandidates.length === 0 ? (
              <p className="text-xs text-rose-600 font-semibold">
                Vui lòng chọn ngày bắt đầu nhỏ hơn hoặc bằng ngày kết thúc.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {dateRangeCandidates.map((d) => {
                  const checked = selectedDates.includes(d);
                  const isSun = isSundayIsoDate(d);
                  return (
                    <label
                      key={d}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer tabular-nums transition-colors ${
                        checked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-surface border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDate(d)}
                        className="w-4 h-4 rounded accent-emerald-600 shrink-0"
                      />
                      <span className={isSun ? 'text-rose-700' : ''}>
                        {getWeekdayVN(d)} {formatShortDateVN(d)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-sky-200/70">
            <button
              type="button"
              onClick={() => setEditorMode('closed')}
              className="px-4 py-2 rounded-xl bg-surface border border-slate-300 text-slate-700 font-bold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
            >
              <Check className="w-4 h-4" />
              <span>
                {editorMode === 'edit' ? 'Lưu lịch học' : 'Tạo tuần học'}
              </span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
