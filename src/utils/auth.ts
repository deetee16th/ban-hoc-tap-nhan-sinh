import { AuthLevel, GroupId, TabId, UserAccount } from '../types';

export function getAuthLevel(account: UserAccount | null): AuthLevel {
  if (!account) return 'guest';
  return account.role;
}

export function getAllowedTabs(level: AuthLevel): TabId[] {
  switch (level) {
    case 'admin':
    case 'banhoctap':
      return ['dashboard', 'checkin', 'insights', 'admin'];
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
  if (!account || account.role !== 'group_officer') return null;
  return account.assignedGroup;
}

export function getAccountBadgeText(account: UserAccount | null): string {
  if (!account) return 'Học viên (Chế độ xem)';
  return account.displayName;
}
