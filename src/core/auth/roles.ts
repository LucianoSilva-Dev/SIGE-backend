import { createAccessControl } from 'better-auth/plugins/access';

export const statement = {
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke', 'delete'],
  profile: ['read', 'update'],
  management: ['all'],
} as const;

export const ac = createAccessControl(statement);

export const userRole = ac.newRole({
  user: [],
  session: [],
  profile: ['read', 'update'],
  management: [],
});

export const adminRole = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'],
  session: ['list', 'revoke', 'delete'],
  profile: ['read', 'update'],
  management: ['all'],
});
