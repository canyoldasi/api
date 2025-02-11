export const PERMISSIONS = {
    UserView: 'UserView',
    UserMutation: 'UserMutation'
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const METADATA_NAME_PERMISSIONS = 'permissions';


