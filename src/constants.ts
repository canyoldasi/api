export const PERMISSIONS = {
    UserRead: 'UserRead',
    UserCreate: 'UserCreate',
    UserUpdate: 'UserUpdate',
    UserDelete: 'UserDelete',
    RoleRead: 'RoleRead',
    RoleCreate: 'RoleCreate',
    RoleUpdate: 'RoleUpdate',
    RoleDelete: 'RoleDelete',
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSIONS_METADATA_NAME = 'permissions';
