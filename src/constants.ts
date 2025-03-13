export const PERMISSIONS = {
    UserView: 'UserView',
    UserMutation: 'UserMutation',
    RoleView: 'RoleView',
    RoleMutation: 'RoleMutation',
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSIONS_METADATA_NAME = 'permissions';
