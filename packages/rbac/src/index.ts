import { UserRole, AgeTier } from '@edusim/shared-types';

export type Action =
  | 'simulation:play'
  | 'formula:use'
  | 'tutor:chat'
  | 'homework:submit'
  | 'homework:create'
  | 'homework:grade'
  | 'student:monitor'
  | 'attendance:mark'
  | 'attendance:view'
  | 'institution:manage';

const PERMISSIONS: Record<UserRole, Set<Action>> = {
  superadmin: new Set<Action>([
    'simulation:play',
    'formula:use',
    'tutor:chat',
    'homework:submit',
    'homework:create',
    'homework:grade',
    'student:monitor',
    'attendance:mark',
    'attendance:view',
    'institution:manage',
  ]),
  admin: new Set<Action>([
    'simulation:play',
    'formula:use',
    'tutor:chat',
    'homework:create',
    'homework:grade',
    'student:monitor',
    'attendance:view',
    'institution:manage',
  ]),
  teacher: new Set<Action>([
    'simulation:play',
    'formula:use',
    'tutor:chat',
    'homework:create',
    'homework:grade',
    'student:monitor',
    'attendance:mark',
    'attendance:view',
  ]),
  student: new Set<Action>([
    'simulation:play',
    'formula:use',
    'tutor:chat',
    'homework:submit',
    'attendance:view',
  ]),
  parent: new Set<Action>([
    'student:monitor',
    'attendance:view',
  ]),
};

export function can(role: UserRole, action: Action | string): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions.has(action as Action);
}

const TIER_RANKS: Record<AgeTier, number> = {
  primary: 1,
  middle: 2,
  high_school: 3,
  university: 4,
};

export function meetsMinTier(userTier: AgeTier, minTier: AgeTier): boolean {
  const userRank = TIER_RANKS[userTier];
  const minRank = TIER_RANKS[minTier];
  if (userRank === undefined || minRank === undefined) return false;
  return userRank >= minRank;
}
