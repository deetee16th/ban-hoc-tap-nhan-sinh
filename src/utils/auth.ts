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

export function getAllowedTabs(level: AuthLevel): TabId[] {
  switch (level) {
    case 'admin':
    case 'banhoctap':
      return ['dashboard', 'checkin', 'insights', 'admin'];
    case 'group':
    case 'group_officer':
      return ['dashboard', 'checkin'];
    case 'guest':
    default:
      return ['dashboard'];
  }
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
  if (role !== 'group' && role !== 'group_officer') return null;
  return normalizeGroupId(
    account.assignedGroup ?? account.groupId,
    account.username
  );
}

export function getAccountBadgeText(account: UserAccount | null): string {
  if (!account) return 'Học viên (Chế độ xem)';
  return account.displayName;
}
