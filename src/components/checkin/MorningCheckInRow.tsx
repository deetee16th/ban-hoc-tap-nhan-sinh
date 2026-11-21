import React from 'react';
import { Video, VideoOff } from 'lucide-react';
import {
  ATTENDANCE_OPTIONS,
  AttendanceButtonOption,
  CAMERA_OPTIONS,
  CameraButtonOption,
  DailyLog,
  Member,
} from '../../types';
import { isLogMorningPerfect } from '../../utils/analytics';

interface MorningCheckInRowProps {
  member: Member;
  log: DailyLog | undefined;
  date: string;
  weekNumber: number;
  onChangeLog: (nextLog: DailyLog) => void;
}

const ATTENDANCE_ACTIVE_STYLE: Record<AttendanceButtonOption, string> = {
  'Đúng giờ': 'bg-emerald-600 text-white border-emerald-600',
  Muộn: 'bg-amber-500 text-white border-amber-500',
  'Vắng CP': 'bg-sky-600 text-white border-sky-600',
  Vắng: 'bg-rose-600 text-white border-rose-600',
};

export const MorningCheckInRow: React.FC<MorningCheckInRowProps> = ({
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

  const hasMorningData =
    current.attendance !== 'Chưa chấm' || current.camera !== 'Chưa chấm';
  const morningPerfect = hasMorningData && isLogMorningPerfect(current);

  const needsMorningNote =
    current.attendance === 'Muộn' ||
    current.attendance === 'Vắng' ||
    current.attendance === 'Vắng CP' ||
    current.camera === 'Không' ||
    current.morningNote.trim().length > 0;

  const handleAttendanceSelect = (status: AttendanceButtonOption) => {
    let nextCamera = current.camera;
    if (status === 'Vắng' || status === 'Vắng CP') {
      nextCamera = 'Không';
    } else if (
      (current.attendance === 'Vắng' || current.attendance === 'Vắng CP') &&
      current.camera === 'Không'
    ) {
      nextCamera = 'Có';
    }

    onChangeLog({
      ...current,
      attendance: status,
      camera: nextCamera,
    });
  };

  const handleCameraSelect = (camera: CameraButtonOption) => {
    onChangeLog({
      ...current,
      camera,
    });
  };

  const handleMorningNoteChange = (morningNote: string) => {
    onChangeLog({
      ...current,
      morningNote,
    });
  };

  const statusPill = !hasMorningData ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
      Chưa chấm
    </span>
  ) : morningPerfect ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
      Đạt sáng
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
      Lưu ý
    </span>
  );

  return (
    <article
      className={`bg-surface rounded-2xl border p-4 sm:px-5 sm:py-4 transition-colors ${
        !hasMorningData
          ? 'border-slate-200'
          : morningPerfect
            ? 'border-emerald-200'
            : 'border-amber-300'
      }`}
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Member Identity + Mobile Status */}
        <div className="flex items-center justify-between gap-2.5 min-w-0 xl:w-72 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
              {member.stt}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {member.fullName}
              </h3>
              <p className="text-xs font-medium text-slate-500 truncate">
                {member.role}
              </p>
            </div>
          </div>

          <div className="shrink-0 xl:hidden">{statusPill}</div>
        </div>

        {/* Compact Controls: Attendance + Camera */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 xl:justify-end">
          {/* 1. Vào lớp */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Vào lớp
            </span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
              {ATTENDANCE_OPTIONS.map((option) => {
                const active = current.attendance === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleAttendanceSelect(option)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      active
                        ? ATTENDANCE_ACTIVE_STYLE[option]
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block h-7 w-px bg-slate-200 shrink-0" />

          {/* 2. Camera */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Camera
            </span>
            <div className="grid grid-cols-2 gap-1.5 sm:flex">
              {CAMERA_OPTIONS.map((camOption) => {
                const active = current.camera === camOption;
                const isOn = camOption === 'Có';
                return (
                  <button
                    key={camOption}
                    type="button"
                    onClick={() => handleCameraSelect(camOption)}
                    className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border inline-flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? isOn
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-ink text-white border-ink'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isOn ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <VideoOff className="w-3.5 h-3.5" />
                    )}
                    <span>{isOn ? 'Có mở' : 'Không'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop status pill */}
          <div className="hidden xl:flex shrink-0 w-24 justify-end">
            {statusPill}
          </div>
        </div>
      </div>

      {/* Tự động mở ô "Ghi chú buổi sáng" khi chọn Muộn / Vắng / Vắng CP / Không mở cam */}
      {needsMorningNote && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 animate-fade-in">
          <label
            htmlFor={`morning-note-${member.id}`}
            className="block text-xs font-bold text-amber-900 mb-1.5"
          >
            Ghi chú buổi sáng
          </label>
          <input
            id={`morning-note-${member.id}`}
            type="text"
            value={current.morningNote}
            onChange={(e) => handleMorningNoteChange(e.target.value)}
            placeholder="Nhập lý do hoặc số phút muộn, VD: Muộn 5 phút do kẹt xe..."
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-50/50 focus:bg-surface border border-amber-200 focus:border-amber-500 text-sm text-slate-900 placeholder:text-slate-400 transition-colors"
          />
        </div>
      )}
    </article>
  );
};
