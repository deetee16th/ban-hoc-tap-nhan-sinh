import React, { useEffect, useState } from 'react';
import { UserCheck, UserMinus, X } from 'lucide-react';
import {
  getGroupDisplayName,
  GROUPS,
  GroupId,
  Member,
  MemberRole,
  MemberStatus,
  ROLE_OPTIONS,
} from '../../types';

interface MemberFormModalProps {
  isOpen: boolean;
  editingMember: Member | null;
  nextStt: number;
  defaultJoinedDate: string;
  groupNames: Record<GroupId, string>;
  onClose: () => void;
  onSave: (member: Member) => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  editingMember,
  nextStt,
  defaultJoinedDate,
  groupNames,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [stt, setStt] = useState(nextStt);
  const [group, setGroup] = useState<GroupId>('G1');
  const [role, setRole] = useState<MemberRole>('Thành viên');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [joinedDate, setJoinedDate] = useState(defaultJoinedDate);
  const [inactiveDate, setInactiveDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingMember) {
      setFullName(editingMember.fullName);
      setStt(editingMember.stt);
      setGroup(editingMember.group);
      setRole(editingMember.role);
      setStatus(editingMember.status);
      setJoinedDate(editingMember.joinedDate || defaultJoinedDate);
      setInactiveDate(editingMember.inactiveDate ?? '');
    } else {
      setFullName('');
      setStt(nextStt);
      setGroup('G1');
      setRole('Thành viên');
      setStatus('active');
      setJoinedDate(defaultJoinedDate);
      setInactiveDate('');
    }
    setError('');
  }, [isOpen, editingMember, nextStt, defaultJoinedDate]);

  if (!isOpen) return null;

  const handleStatusChange = (nextStatus: MemberStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'inactive' && !inactiveDate) {
      setInactiveDate(defaultJoinedDate);
    }
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError('Vui lòng nhập họ và tên học viên.');
      return;
    }
    if (!joinedDate) {
      setError('Vui lòng chọn ngày tham gia lớp.');
      return;
    }
    if (status === 'inactive' && !inactiveDate) {
      setError('Vui lòng chọn ngày bắt đầu nghỉ của học viên.');
      return;
    }

    const parsedStt = Math.max(1, Number(stt) || nextStt);
    const id =
      editingMember?.id ?? `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload: Member = {
      id,
      stt: parsedStt,
      fullName: trimmed,
      group,
      role,
      status,
      joinedDate,
    };

    if (status === 'inactive') {
      payload.inactiveDate = inactiveDate;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
    >
      <div className="bg-surface rounded-2xl border border-slate-200 shadow-elevated w-full max-w-lg p-6 space-y-5 animate-fade-in my-auto">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="member-modal-title"
            className="text-xl font-extrabold text-slate-900 tracking-tight"
          >
            {editingMember ? 'Cập nhật thành viên' : 'Thêm thành viên mới'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="tap-compact p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="member-fullname"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Họ và tên <span className="text-rose-600">*</span>
            </label>
            <input
              id="member-fullname"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-base text-slate-900"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="member-stt"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Số thứ tự (STT)
              </label>
              <input
                id="member-stt"
                type="number"
                min={1}
                value={stt}
                onChange={(e) => setStt(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-base text-slate-900 font-semibold tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="member-group"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Phân nhóm
              </label>
              <select
                id="member-group"
                value={group}
                onChange={(e) => setGroup(e.target.value as GroupId)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-900 font-bold"
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {getGroupDisplayName(g, groupNames)} ({g})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="member-role"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Vai trò trong lớp
              </label>
              <select
                id="member-role"
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base text-slate-900 font-bold"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="member-joined-date"
                className="block text-sm font-bold text-slate-700 mb-1.5"
              >
                Ngày tham gia
              </label>
              <input
                id="member-joined-date"
                type="date"
                value={joinedDate}
                onChange={(e) => {
                  setJoinedDate(e.target.value);
                  if (error) setError('');
                }}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 text-sm sm:text-base font-semibold text-slate-900 tabular-nums"
              />
            </div>
          </div>

          {/* Trạng thái hoạt động (Active / Inactive) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="text-sm font-bold text-slate-700">
              Trạng thái học tập
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-surface text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Đang hoạt động</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('inactive')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                  status === 'inactive'
                    ? 'bg-ink text-white border-ink'
                    : 'bg-surface text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserMinus className="w-4 h-4" />
                <span>Nghỉ giữa chừng</span>
              </button>
            </div>

            {status === 'inactive' && (
              <div className="pt-1 space-y-1.5">
                <label
                  htmlFor="member-inactive-date"
                  className="block text-xs font-bold text-slate-700"
                >
                  Ngày bắt đầu nghỉ (inactiveDate) *
                </label>
                <input
                  id="member-inactive-date"
                  type="date"
                  value={inactiveDate}
                  onChange={(e) => {
                    setInactiveDate(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-surface border border-slate-300 text-sm font-semibold text-slate-900 tabular-nums"
                />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Từ ngày này trở đi, học viên sẽ tự động ẩn khỏi Sổ Theo Dõi Ngày và không tính vào tỷ lệ vắng của nhóm, nhưng vẫn giữ nguyên dữ liệu lịch sử cũ.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-surface hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base"
            >
              {editingMember ? 'Lưu thay đổi' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
