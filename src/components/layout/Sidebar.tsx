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

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  allowedTabs: TabId[];
  currentAccount: UserAccount | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  uiSettings: UiSettings;
  canUsePresentation: boolean;
  currentWeek: WeekConfig | undefined;
  totalMembers: number;
  qualifiedCount: number;
  qualifiedRate: number;
  onOpenPresentation: () => void;
}

const NAV_ITEMS: Array<{
  id: TabId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'dashboard',
    label: 'Báo Cáo Tuần',
    description: 'Tổng kết tuần',
    icon: BarChart3,
  },
  {
    id: 'checkin',
    label: 'Sổ Theo Dõi Ngày',
    description: 'Điểm danh sáng & Chấm bài tối',
    icon: BookOpenCheck,
  },
  {
    id: 'insights',
    label: 'Điểm Sáng & Đồng Hành',
    description: 'Tư liệu MC & Trợ lực',
    icon: HeartHandshake,
  },
  {
    id: 'admin',
    label: 'Quản Lý Lớp',
    description: 'Học viên, Giao diện & Dữ liệu',
    icon: Settings,
  },
];

function getMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return (words[0]?.slice(0, 2) || 'NS').toUpperCase();
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  allowedTabs,
  currentAccount,
  onOpenLogin,
  onLogout,
  uiSettings,
  canUsePresentation,
  currentWeek,
  totalMembers,
  qualifiedCount,
  qualifiedRate,
  onOpenPresentation,
}) => {
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    allowedTabs.includes(item.id)
  );
  const badgeText = getAccountBadgeText(currentAccount);
  const monogram = getMonogram(uiSettings.appName);

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-surface border-r border-slate-200 z-30">
      {/* Brand header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm tracking-tight shrink-0">
          {monogram}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug truncate">
            {uiSettings.appName}
          </h1>
          {uiSettings.appSubtitle && (
            <p className="text-xs font-medium text-slate-500 truncate">
              {uiSettings.appSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Auth / RBAC Status Card */}
      <div className="px-4 pt-4">
        {currentAccount ? (
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3.5 space-y-2.5">
            <div className="min-w-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                {badgeText}
              </span>
              <div className="text-sm font-extrabold text-slate-900 truncate mt-1.5">
                {currentAccount.displayName}
              </div>
              <div className="text-xs font-medium text-emerald-800 truncate">
                @{currentAccount.username}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-emerald-200 hover:border-rose-200 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-slate-800 truncate">
                {badgeText}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Chỉ xem Báo Cáo Tuần
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đăng nhập Cán sự</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto"
        aria-label="Điều hướng chính"
      >
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left border transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-emerald-600' : 'text-slate-500'
                }`}
              />
              <div className="min-w-0">
                <div
                  className={`text-sm leading-snug truncate ${
                    isActive ? 'font-bold text-emerald-900' : 'font-semibold'
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Weekly Summary & Zoom Presentation CTA (Admin/BanHocTap only) */}
      <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/70">
        <div className="rounded-2xl bg-surface border border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{currentWeek?.label ?? 'Tuần học'}</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full tabular-nums">
              {totalMembers} học viên
            </span>
          </div>
          {currentWeek?.topic && (
            <p className="text-sm font-semibold text-slate-800 mt-1.5 line-clamp-2">
              {currentWeek.topic}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <span>Đạt chuẩn cả tuần</span>
            <span className="font-extrabold text-emerald-700 text-sm tabular-nums">
              {uiSettings.showPercentage
                ? `${qualifiedRate}%`
                : `${qualifiedCount}/${totalMembers}`}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${qualifiedRate}%` }}
            />
          </div>
        </div>

        {canUsePresentation && (
          <button
            type="button"
            onClick={onOpenPresentation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-all"
          >
            <Presentation className="w-4 h-4" />
            <span>Trình chiếu Zoom</span>
          </button>
        )}
      </div>
    </aside>
  );
};
