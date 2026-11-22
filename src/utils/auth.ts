import {
  AuthLevel,
  GroupId,
  normalizeAccountRole,
  normalizeGroupId,
  TabId,
  UserAccount,
} from '../types';

export function getAuthLevel(account: UserAccount | null): AuthLevel {
  if (!account) return 'guest';
  return normalizeAccountRole(account.role, account.username);
}

export function getAllowedTabs(
  level: AuthLevel,
  isLoggedIn = level !== 'guest'
): TabId[] {
  if (!isLoggedIn && level === 'guest') {
    return ['dashboard'];
  }
  if (level === 'admin' || level === 'banhoctap') {
    return ['dashboard', 'checkin', 'insights', 'admin'];
  }
  // Mọi tài khoản đã đăng nhập (bao gồm role === 'group') đều mở tab Sổ Theo Dõi Ngày
  return ['dashboard', 'checkin'];
}

export function canManageAccounts(level: AuthLevel): boolean {
  return level === 'admin';
}

export function canAccessAllGroups(level: AuthLevel): boolean {
  return level === 'admin' || level === 'banhoctap';
}

export function canUsePresentationMode(level: AuthLevel): boolean {
  return level === 'admin' || level === 'banhoctap';
}

export function canViewIndividualDetails(level: AuthLevel): boolean {
  return level === 'admin' || level === 'banhoctap';
}

export function getLockedGroup(account: UserAccount | null): GroupId | null {
  if (!account) return null;
  const role = normalizeAccountRole(account.role, account.username);
  if (role === 'admin' || role === 'banhoctap') return null;
  return normalizeGroupId(
    account.group_id ?? account.groupId ?? account.assignedGroup,
    account.username
  );
}

export function getAccountBadgeText(account: UserAccount | null): string {
  if (!account) return 'Học viên (Chế độ xem)';
  return account.displayName;
}
