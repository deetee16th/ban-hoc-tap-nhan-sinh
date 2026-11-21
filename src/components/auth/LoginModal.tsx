import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, UserRound, X } from 'lucide-react';
import { getGroupDisplayName, GroupId, UserAccount } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  accounts: UserAccount[];
  groupNames: Record<GroupId, string>;
  onClose: () => void;
  onAuthenticate: (username: string, password: string) => UserAccount | null;
  onLoginSuccess: (account: UserAccount) => void;
}

function getScopeDescription(
  account: UserAccount,
  groupNames: Record<GroupId, string>
): string {
  switch (account.role) {
    case 'admin':
      return 'Toàn quyền 4 tab & tùy chỉnh giao diện';
    case 'banhoctap':
      return 'Báo cáo, Điểm sáng & chấm hộ 4 nhóm';
    case 'group_officer': {
      const gName = account.assignedGroup
        ? getGroupDisplayName(account.assignedGroup, groupNames)
        : account.displayName.replace('Cán sự ', '');
      return `Báo cáo & chỉ chấm ${gName}`;
    }
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  accounts,
  groupNames,
  onClose,
  onAuthenticate,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    const authenticated = onAuthenticate(username, password);
    if (!authenticated) {
      setError(
        'Tên đăng nhập hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại hoặc dùng gợi ý bên dưới.'
      );
      return;
    }

    onLoginSuccess(authenticated);
  };

  const handleQuickFill = (account: UserAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-surface rounded-2xl border border-slate-200 shadow-elevated w-full max-w-xl p-5 sm:p-7 space-y-5 animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="login-modal-title"
              className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight"
            >
              Đăng nhập Cán sự
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Nhập tên đăng nhập và mật khẩu để truy cập phân quyền lớp học
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại đăng nhập"
            className="tap-compact p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Tên đăng nhập (Username)
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="VD: admin, banhoctap, nhom1..."
                className="w-full min-h-[46px] pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 focus:border-emerald-600 text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập mật khẩu"
                className="w-full min-h-[46px] pl-4 pr-12 py-2.5 rounded-xl bg-slate-50 focus:bg-surface border border-slate-200 focus:border-emerald-600 text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="tap-compact absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 bg-surface hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </form>

        {/* Bảng gợi ý đăng nhập nhanh 6 tài khoản */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Gợi ý 6 tài khoản mẫu (bấm 1 chạm để điền nhanh)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="text-left px-3 py-2.5 rounded-xl bg-surface hover:bg-amber-100/60 border border-amber-200 transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {acc.displayName}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {getScopeDescription(acc, groupNames)}
                  </div>
                </div>
                <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold tabular-nums">
                  {acc.username} / {acc.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
