import React from 'react';
import {
  BarChart3,
  BookOpenCheck,
  HeartHandshake,
  KeyRound,
  LogOut,
  Presentation,
  Settings,
} from 'lucide-react';
import { TabId, UiSettings, UserAccount, WeekConfig } from '../../types';
import { getAccountBadgeText } from '../../utils/auth';
import { DisplayControls } from './DisplayControls';

const MOBILE_TABS: Array<{
  id: TabId;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', shortLabel: 'Báo cáo', icon: BarChart3 },
  { id: 'checkin', shortLabel: 'Sổ ngày', icon: BookOpenCheck },
  { id: 'insights', shortLabel: 'Điểm sáng', icon: HeartHandshake },
  { id: 'admin', shortLabel: 'Quản lý', icon: Settings },
];

function getMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return (words[0]?.slice(0, 2) || 'NS').toUpperCase();
}

export const MobileHeader: React.FC<{
  currentWeek: WeekConfig | undefined;
  currentAccount: UserAccount | null;
  uiSettings: UiSettings;
  canUsePresentation: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenPresentation: () => void;
}> = ({
  currentWeek,
  currentAccount,
  uiSettings,
  canUsePresentation,
  onOpenLogin,
  onLogout,
  onOpenPresentation,
}) => {
  const badgeText = getAccountBadgeText(currentAccount);
  const monogram = getMonogram(uiSettings.appName);

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 pt-safe space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs tracking-tight shrink-0">
            {monogram}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold text-slate-900 truncate leading-tight">
              {uiSettings.appName}
            </div>
            <div className="text-xs font-medium text-slate-500 truncate">
              {uiSettings.appSubtitle ||
                (currentWeek ? `${currentWeek.label} • ${currentWeek.topic}` : '')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <DisplayControls compact />

          {/* Ẩn hoàn toàn trên điện thoại (< 768px), chỉ hiện trên Tablet >= 768px cho admin/banhoctap */}
          {canUsePresentation && (
            <button
              type="button"
              onClick={onOpenPresentation}
              className="hidden md:inline-flex shrink-0 items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs"
            >
              <Presentation className="w-4 h-4" />
              <span>Trình chiếu</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Status Bar on Mobile */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
        {currentAccount ? (
          <>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-900 truncate">
                @{currentAccount.username}
              </span>
              <span className="truncate text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {badgeText}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="tap-compact shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-semibold text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-medium text-slate-500 truncate">
              {badgeText}
            </span>
            <button
              type="button"
              onClick={onOpenLogin}
              className="tap-compact shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đăng nhập Cán sự</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<{
  activeTab: TabId;
  allowedTabs: TabId[];
  onSelectTab: (tab: TabId) => void;
}> = ({ activeTab, allowedTabs, onSelectTab }) => {
  const visibleTabs = MOBILE_TABS.filter((t) => allowedTabs.includes(t.id));

  if (visibleTabs.length <= 1) {
    return null;
  }

  const gridColsClass =
    visibleTabs.length === 2
      ? 'grid-cols-2'
      : visibleTabs.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-4';

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-md bg-white/85 dark:bg-[#1B1C20]/85 border-t border-slate-200 pb-safe"
      aria-label="Điều hướng di động"
    >
      <div className={`grid ${gridColsClass}`}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[60px] px-1 py-2 transition-colors ${
                isActive
                  ? 'text-emerald-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-600"
                />
              )}
              <Icon
                className={`w-5 h-5 mb-1 ${
                  isActive ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
              <span
                className={`text-xs leading-tight ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
