import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface DisplayControlsProps {
  /** 'inverted' dùng trên thanh tiêu đề trình chiếu Zoom nền xanh đậm */
  variant?: 'default' | 'inverted';
  compact?: boolean;
}

export const DisplayControls: React.FC<DisplayControlsProps> = ({
  variant = 'default',
  compact = false,
}) => {
  const { theme, fontScale, toggleTheme, setFontScale } = usePreferences();
  const isDark = theme === 'dark';
  const isInverted = variant === 'inverted';

  const groupWrapperClass = isInverted
    ? 'bg-white/10 border-white/20'
    : 'bg-slate-100/80 border-slate-200';

  const sizeBtnClass = (active: boolean) => {
    if (isInverted) {
      return active
        ? 'bg-white text-[#1E5631] font-bold'
        : 'text-white/80 hover:text-white font-semibold';
    }
    return active
      ? 'bg-surface text-slate-900 border border-slate-200 font-bold'
      : 'text-slate-600 hover:text-slate-900 border border-transparent font-semibold';
  };

  const themeBtnClass = isInverted
    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
    : 'bg-surface hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900';

  const heightClass = compact ? 'h-9 min-h-[36px] tap-compact' : 'h-10';

  return (
    <div className="inline-flex items-center gap-2 shrink-0">
      {/* Nút chỉnh cỡ chữ A / A+ dành cho học viên lớn tuổi */}
      <div
        role="group"
        aria-label="Cỡ chữ hiển thị"
        className={`inline-flex items-center p-0.5 rounded-xl border ${groupWrapperClass}`}
      >
        <button
          type="button"
          onClick={() => setFontScale('normal')}
          aria-pressed={fontScale === 'normal'}
          title="Cỡ chữ tiêu chuẩn (100%)"
          className={`${heightClass} px-2.5 rounded-[9px] text-xs leading-none inline-flex items-center justify-center transition-all ${sizeBtnClass(
            fontScale === 'normal'
          )}`}
        >
          A
        </button>
        <button
          type="button"
          onClick={() => setFontScale('large')}
          aria-pressed={fontScale === 'large'}
          title="Cỡ chữ lớn dễ đọc hơn (+12.5%)"
          className={`${heightClass} px-2.5 rounded-[9px] text-sm leading-none inline-flex items-center justify-center transition-all ${sizeBtnClass(
            fontScale === 'large'
          )}`}
        >
          A+
        </button>
      </div>

      {/* Nút chuyển Sáng / Tối dịu mắt cho buổi học 5h sáng */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối dịu mắt'}
        aria-pressed={isDark}
        title={isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối (dịu mắt 5h sáng)'}
        className={`${heightClass} ${
          compact ? 'px-2.5' : 'px-3'
        } rounded-xl border inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${themeBtnClass}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-500 shrink-0" />
        ) : (
          <Moon className="w-4 h-4 shrink-0" />
        )}
        {!compact && (
          <span className="hidden sm:inline">{isDark ? 'Sáng' : 'Tối'}</span>
        )}
      </button>
    </div>
  );
};
