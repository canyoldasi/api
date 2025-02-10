export const PERMISSIONS = {
    UserView: 'UserView',
    UserChange: 'UserChange'
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const METADATA_NAME_PERMISSIONS = 'permissions';

export const METADATA_NAME_ROLES = 'roles';


