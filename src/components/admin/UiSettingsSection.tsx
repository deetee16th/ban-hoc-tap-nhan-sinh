import React, { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import {
  DEFAULT_UI_SETTINGS,
  GROUPS,
  GroupId,
  UiSettings,
} from '../../types';

interface UiSettingsSectionProps {
  uiSettings: UiSettings;
  onSaveUiSettings: (next: UiSettings) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

interface ToggleRowProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  id,
  title,
  description,
  checked,
  onToggle,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-sm sm:text-base font-bold text-slate-900 cursor-pointer"
        >
          {title}
        </label>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none ${
          checked ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
      >
        <span className="sr-only">{title}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white transition duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const UiSettingsSection: React.FC<UiSettingsSectionProps> = ({
  uiSettings,
  onSaveUiSettings,
  onNotify,
}) => {
  const [appName, setAppName] = useState(uiSettings.appName);
  const [appSubtitle, setAppSubtitle] = useState(uiSettings.appSubtitle);
  const [groupNames, setGroupNames] = useState<Record<GroupId, string>>({
    ...uiSettings.groupNames,
  });

  useEffect(() => {
    setAppName(uiSettings.appName);
    setAppSubtitle(uiSettings.appSubtitle);
    setGroupNames({ ...uiSettings.groupNames });
  }, [uiSettings]);

  const handleSaveTextConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const next: UiSettings = {
      ...uiSettings,
      appName: appName.trim() || DEFAULT_UI_SETTINGS.appName,
      appSubtitle: appSubtitle.trim(),
      groupNames: {
        G1: groupNames.G1.trim() || DEFAULT_UI_SETTINGS.groupNames.G1,
        G2: groupNames.G2.trim() || DEFAULT_UI_SETTINGS.groupNames.G2,
        G3: groupNames.G3.trim() || DEFAULT_UI_SETTINGS.groupNames.G3,
        G4: groupNames.G4.trim() || DEFAULT_UI_SETTINGS.groupNames.G4,
      },
    };
    onSaveUiSettings(next);
    onNotify('Đã lưu cấu hình tên ứng dụng và tên 4 nhóm!');
  };

  const handleToggle = (
    key:
      | 'showGroupSummary'
      | 'showPercentage'
      | 'allowGroupOfficerViewOtherGroups',
    label: string
  ) => {
    const nextValue = !uiSettings[key];
    onSaveUiSettings({
      ...uiSettings,
      [key]: nextValue,
    });
    onNotify(`${label}: ${nextValue ? 'Đã bật' : 'Đã tắt'}.`);
  };

  const handleResetUiDefaults = () => {
    onSaveUiSettings({
      ...DEFAULT_UI_SETTINGS,
      groupNames: { ...DEFAULT_UI_SETTINGS.groupNames },
    });
    onNotify('Đã khôi phục cấu hình giao diện mặc định.', 'info');
  };

  return (
    <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Cấu hình Giao diện &amp; Hiển thị
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tùy chỉnh tiêu đề, tên 4 nhóm và quyền xem báo cáo mà không cần sửa mã nguồn
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetUiDefaults}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục mặc định</span>
        </button>
      </div>

      {/* Form Tên ứng dụng, Mô tả phụ & Tên 4 nhóm */}
      <form onSubmit={handleSaveTextConfig} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cfg-app-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Tên ứng dụng (Header / Sidebar)
            </label>
            <input
              id="cfg-app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Lớp Nhân Sinh"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-sm sm:text-base font-bold text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-app-subtitle"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Dòng mô tả phụ
            </label>
            <input
              id="cfg-app-subtitle"
              type="text"
              value={appSubtitle}
              onChange={(e) => setAppSubtitle(e.target.value)}
              placeholder="Quản lý học tập & rèn luyện"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-sm sm:text-base text-slate-900"
            />
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Tùy chỉnh tên 4 nhóm (G1 – G4)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {GROUPS.map((groupId) => (
              <div key={groupId}>
                <label
                  htmlFor={`cfg-group-${groupId}`}
                  className="block text-xs font-bold text-slate-500 mb-1"
                >
                  Mã {groupId}
                </label>
                <input
                  id={`cfg-group-${groupId}`}
                  type="text"
                  value={groupNames[groupId]}
                  onChange={(e) =>
                    setGroupNames((prev) => ({
                      ...prev,
                      [groupId]: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Lưu tên hiển thị</span>
          </button>
        </div>
      </form>

      {/* 3 Nút gạt kiểm soát hiển thị */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Kiểm soát hiển thị Báo cáo cho Học viên &amp; Cán sự nhóm
        </div>

        <ToggleRow
          id="toggle-show-group-summary"
          title="Hiển thị phần Tổng kết 4 nhóm ở trang Báo cáo"
          description="Khi tắt, trang Báo cáo tuần chỉ hiển thị 4 thẻ tổng quan chính."
          checked={uiSettings.showGroupSummary}
          onToggle={() =>
            handleToggle('showGroupSummary', 'Hiển thị Tổng kết 4 nhóm')
          }
        />

        <ToggleRow
          id="toggle-show-percentage"
          title="Hiển thị số liệu dạng Phần trăm (%) thay vì Số lượng (5/6)"
          description="Mặc định tắt để ưu tiên hiển thị trực diện số người/số lượt (VD: 5/6)."
          checked={uiSettings.showPercentage}
          onToggle={() =>
            handleToggle('showPercentage', 'Hiển thị số liệu dạng Phần trăm (%)')
          }
        />

        <ToggleRow
          id="toggle-group-officer-view-others"
          title="Cho phép cán sự nhóm (nhom1 – nhom4) xem tổng kết các nhóm khác"
          description="Khi tắt, tài khoản nhóm chỉ thấy thẻ tổng kết của đúng nhóm mình trên Báo cáo tuần."
          checked={uiSettings.allowGroupOfficerViewOtherGroups}
          onToggle={() =>
            handleToggle(
              'allowGroupOfficerViewOtherGroups',
              'Cán sự nhóm xem tổng kết nhóm khác'
            )
          }
        />
      </div>
    </section>
  );
};
