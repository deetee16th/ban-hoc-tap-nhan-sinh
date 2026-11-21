import React, { useMemo, useState } from 'react';
import {
  Check,
  ClipboardCopy,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DailyLog,
  getGroupDisplayName,
  GROUP_META,
  GROUPS,
  GroupId,
  Member,
  MemberStatus,
  UiSettings,
  UserAccount,
  WeekConfig,
} from '../../types';
import { formatDateVN, formatShortDateVN } from '../../utils/analytics';
import {
  copyWeekSummaryForGoogleSheets,
  exportWeekToExcel,
} from '../../utils/excelExport';
import { MemberFormModal } from './MemberFormModal';
import { UiSettingsSection } from './UiSettingsSection';
import { WeekManagerSection } from './WeekManagerSection';

interface AdminSettingsProps {
  members: Member[];
  weeks: WeekConfig[];
  logs: DailyLog[];
  accounts: UserAccount[];
  uiSettings: UiSettings;
  selectedWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onSaveWeek: (week: WeekConfig) => void;
  onUpdateAccountPassword: (accountId: string, newPassword: string) => void;
  onSaveUiSettings: (settings: UiSettings) => void;
  onNotify: (text: string, tone?: 'success' | 'info') => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  members,
  weeks,
  logs,
  accounts,
  uiSettings,
  selectedWeek,
  onSelectWeek,
  onSaveMember,
  onDeleteMember,
  onSaveWeek,
  onUpdateAccountPassword,
  onSaveUiSettings,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | GroupId>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MemberStatus>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // State quản lý mật khẩu tài khoản
  const [revealedAccountIds, setRevealedAccountIds] = useState<
    Record<string, boolean>
  >({});
  const [editingPasswordAccountId, setEditingPasswordAccountId] = useState<
    string | null
  >(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const currentWeek = useMemo(
    () => weeks.find((w) => w.weekNumber === selectedWeek) ?? weeks[0],
    [weeks, selectedWeek]
  );

  const activeCount = useMemo(
    () => members.filter((m) => m.status === 'active').length,
    [members]
  );

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return members
      .filter((m) => {
        if (groupFilter !== 'ALL' && m.group !== groupFilter) return false;
        if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
        if (
          normalizedQuery &&
          !m.fullName.toLowerCase().includes(normalizedQuery) &&
          !m.role.toLowerCase().includes(normalizedQuery)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.stt - b.stt);
  }, [members, groupFilter, statusFilter, searchTerm]);

  const nextStt = useMemo(() => {
    return members.reduce((max, m) => Math.max(max, m.stt), 0) + 1;
  }, [members]);

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleConfirmDeleteMember = () => {
    if (!deletingMember) return;
    onDeleteMember(deletingMember.id);
    onNotify(`Đã xóa thành viên ${deletingMember.fullName}.`, 'info');
    setDeletingMember(null);
  };

  const handleExportExcel = () => {
    if (!currentWeek) {
      onNotify('Chưa có tuần học nào để xuất Excel.', 'info');
      return;
    }
    const rowCount = exportWeekToExcel(
      currentWeek,
      members,
      logs,
      uiSettings.groupNames
    );
    onNotify(
      `Đã xuất file Excel (.xlsx) 5 sheet cho ${currentWeek.label} (${rowCount} học viên)!`
    );
  };

  const handleCopyGoogleSheets = async () => {
    if (!currentWeek) {
      onNotify('Chưa có tuần học nào để sao chép.', 'info');
      return;
    }
    const ok = await copyWeekSummaryForGoogleSheets(
      currentWeek,
      members,
      logs,
      uiSettings.groupNames
    );
    if (ok) {
      onNotify('Đã sao chép! Bạn chỉ cần mở Google Sheets và bấm Ctrl+V');
    } else {
      onNotify('Trình duyệt không hỗ trợ sao chép tự động.', 'info');
    }
  };

  const toggleRevealPassword = (accountId: string) => {
    setRevealedAccountIds((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const handleStartEditPassword = (account: UserAccount) => {
    setEditingPasswordAccountId(account.id);
    setNewPasswordInput('');
  };

  const handleSaveNewPassword = (account: UserAccount) => {
    const trimmed = newPasswordInput.trim();
    if (trimmed.length < 4) {
      onNotify('Mật khẩu mới cần có ít nhất 4 ký tự.', 'info');
      return;
    }
    onUpdateAccountPassword(account.id, trimmed);
    setEditingPasswordAccountId(null);
    setNewPasswordInput('');
    onNotify(`Đã cập nhật mật khẩu cho tài khoản @${account.username}.`);
  };

  const handleResetDefaultPassword = (account: UserAccount) => {
    onUpdateAccountPassword(account.id, '123456');
    setEditingPasswordAccountId(null);
    setNewPasswordInput('');
    onNotify(`Đã đặt lại mật khẩu tài khoản @${account.username} về 123456.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Quản trị lớp học &amp; Lưu trữ
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Quản Lý Lớp &amp; Dữ Liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1 tabular-nums">
            {activeCount} đang hoạt động / {members.length} tổng thành viên •{' '}
            {weeks.length} tuần học • {logs.length} nhật ký học tập.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddMember}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm thành viên</span>
        </button>
      </section>

      {/* Member Management Section */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">
            Danh sách thành viên ({filteredMembers.length})
          </h2>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên hoặc vai trò..."
                className="w-full sm:w-56 min-h-[42px] pl-10 pr-4 py-2 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-sm text-slate-900"
              />
            </div>

            <select
              aria-label="Lọc theo nhóm"
              value={groupFilter}
              onChange={(e) =>
                setGroupFilter(e.target.value as 'ALL' | GroupId)
              }
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
            >
              <option value="ALL">Tất cả 4 nhóm</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {getGroupDisplayName(g, uiSettings.groupNames)}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | MemberStatus)
              }
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Nghỉ giữa chừng</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-14">STT</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Nhóm</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái &amp; Ngày vào</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-sm">
              {filteredMembers.map((member) => {
                const meta = GROUP_META[member.group];
                const isInactive = member.status === 'inactive';
                return (
                  <tr
                    key={member.id}
                    className={
                      isInactive
                        ? 'bg-slate-50/80 opacity-80'
                        : 'hover:bg-slate-50/70'
                    }
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-500 tabular-nums">
                      {member.stt}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-[15px]">
                      {member.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                      >
                        {getGroupDisplayName(
                          member.group,
                          uiSettings.groupNames
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {member.role}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        {isInactive ? (
                          <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold tabular-nums">
                            Nghỉ từ{' '}
                            {member.inactiveDate
                              ? formatShortDateVN(member.inactiveDate)
                              : '—'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center self-start px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            Đang hoạt động
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          Vào lớp: {formatDateVN(member.joinedDate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMember(member)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMember(member)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List (tối ưu 375px, không tràn ngang) */}
        <div className="md:hidden space-y-3">
          {filteredMembers.map((member) => {
            const meta = GROUP_META[member.group];
            const isInactive = member.status === 'inactive';
            return (
              <div
                key={member.id}
                className={`rounded-xl border p-4 space-y-3 ${
                  isInactive
                    ? 'border-slate-300 bg-slate-100/70'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 tabular-nums">
                        #{member.stt}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {member.fullName}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1 tabular-nums">
                      {member.role} • Vào {formatShortDateVN(member.joinedDate)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                  >
                    {getGroupDisplayName(member.group, uiSettings.groupNames)}
                  </span>
                </div>

                <div>
                  {isInactive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold tabular-nums">
                      Nghỉ từ{' '}
                      {member.inactiveDate
                        ? formatDateVN(member.inactiveDate)
                        : '—'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      Đang hoạt động
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(member)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-slate-200 text-slate-800 font-bold text-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa thông tin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMember(member)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weeks (Flexible) + Excel & Google Sheets Export Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <WeekManagerSection
          weeks={weeks}
          selectedWeek={selectedWeek}
          onSelectWeek={onSelectWeek}
          onSaveWeek={onSaveWeek}
          onNotify={onNotify}
        />

        {/* Excel (.xlsx) 5 Sheet + Copy Google Sheets + Reset */}
        <section className="xl:col-span-5 bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Xuất báo cáo &amp; Dữ liệu
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Xuất Excel 5 sheet hoặc dán trực tiếp sang Google Sheets
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 leading-relaxed tabular-nums">
            Tuần đang chọn xuất:{' '}
            <strong className="text-slate-900">
              {currentWeek?.label ?? `Tuần ${selectedWeek}`}
            </strong>{' '}
            ({currentWeek?.studyDates.length ?? 0} buổi học). File Excel gồm 5
            sheet: <code>Tong_hop_tuan</code>, <code>Nhom_1</code>,{' '}
            <code>Nhom_2</code>, <code>Nhom_3</code>, <code>Nhom_4</code>.
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>
                Xuất Excel {currentWeek?.label ?? `Tuần ${selectedWeek}`} (.xlsx)
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyGoogleSheets}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base transition-colors"
            >
              <ClipboardCopy className="w-5 h-5" />
              <span>Copy dữ liệu cho Google Sheets</span>
            </button>
          </div>
        </section>
      </div>

      {/* Account Password Management (Admin Exclusive) */}
      <section className="bg-surface rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Tài khoản Cán sự &amp; Đặt lại Mật khẩu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Độc quyền của Admin: xem mật khẩu hiện tại, đổi mật khẩu hoặc đặt lại về 123456
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isRevealed = Boolean(revealedAccountIds[acc.id]);
            const isEditingPwd = editingPasswordAccountId === acc.id;

            return (
              <div
                key={acc.id}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-bold text-slate-900 truncate">
                        {acc.displayName}
                      </div>
                      <div className="text-xs font-semibold text-emerald-700">
                        @{acc.username}
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-surface border border-slate-200 text-[11px] font-bold text-slate-700">
                      {acc.role === 'admin'
                        ? 'Toàn quyền'
                        : acc.role === 'banhoctap'
                          ? '4 nhóm'
                          : acc.assignedGroup
                            ? getGroupDisplayName(
                                acc.assignedGroup,
                                uiSettings.groupNames
                              )
                            : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs font-medium text-slate-600">
                      Mật khẩu:{' '}
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {isRevealed ? acc.password : '••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(acc.id)}
                      aria-label={isRevealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="tap-compact p-1.5 rounded-lg text-slate-500 hover:bg-surface hover:text-slate-800 border border-transparent hover:border-slate-200"
                    >
                      {isRevealed ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isEditingPwd ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu mới (>= 4 ký tự)"
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-surface border border-emerald-400 text-sm text-slate-900"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveNewPassword(acc)}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPasswordAccountId(null)}
                        className="px-3 min-h-[38px] rounded-lg bg-surface border border-slate-300 text-slate-700 font-bold text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleStartEditPassword(acc)}
                      className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetDefaultPassword(acc)}
                      className="min-h-[38px] px-3 inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs tabular-nums"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>123456</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Cấu hình Giao diện & Hiển thị (Admin Exclusive) */}
      <UiSettingsSection
        uiSettings={uiSettings}
        onSaveUiSettings={onSaveUiSettings}
        onNotify={onNotify}
      />

      {/* Member Modal */}
      <MemberFormModal
        isOpen={isModalOpen}
        editingMember={editingMember}
        nextStt={nextStt}
        defaultJoinedDate={currentWeek?.startDate ?? '2026-11-02'}
        groupNames={uiSettings.groupNames}
        onClose={() => setIsModalOpen(false)}
        onSave={(saved) => {
          onSaveMember(saved);
          onNotify(
            editingMember
              ? `Đã cập nhật thông tin ${saved.fullName}.`
              : `Đã thêm thành viên ${saved.fullName} vào ${getGroupDisplayName(saved.group, uiSettings.groupNames)}.`
          );
        }}
      />

      {/* Delete Member Confirm Modal */}
      {deletingMember && (
        <div
          className="fixed inset-0 z-50 bg-black/55 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface rounded-2xl border border-slate-200 shadow-elevated max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">
              Xác nhận xóa thành viên?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa{' '}
              <span className="font-bold text-slate-900">
                {deletingMember.fullName}
              </span>{' '}
              khỏi{' '}
              {getGroupDisplayName(deletingMember.group, uiSettings.groupNames)}
              ? Các nhật ký điểm danh gắn với học viên này cũng sẽ được dọn dẹp.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-surface hover:bg-slate-50 font-bold text-sm text-slate-700"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm"
              >
                Xóa thành viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
