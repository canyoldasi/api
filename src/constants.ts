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

export const LOG_LEVEL = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const PERSON_TYPE = {
    INDIVIDUAL: 'INDIVIDUAL',
    CORPORATE: 'CORPORATE',
} as const;

export const CUSTOMER_STATUS = {
    ACTIVE: 'ACTIVE',
    PASSIVE: 'PASSIVE',
    LEAD: 'LEAD',
    BLOCKED: 'BLOCKED',
} as const;

export type PersonType = (typeof PERSON_TYPE)[keyof typeof PERSON_TYPE];
export type CustomerStatus = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];
