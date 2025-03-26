export const PERMISSIONS = {
    UserRead: 'UserRead',
    UserCreate: 'UserCreate',
    UserUpdate: 'UserUpdate',
    UserDelete: 'UserDelete',
    RoleRead: 'RoleRead',
    RoleCreate: 'RoleCreate',
    RoleUpdate: 'RoleUpdate',
    RoleDelete: 'RoleDelete',
    AccountRead: 'AccountRead',
    AccountCreate: 'AccountCreate',
    AccountUpdate: 'AccountUpdate',
    AccountDelete: 'AccountDelete',
    TransactionRead: 'TransactionRead',
    TransactionCreate: 'TransactionCreate',
    TransactionUpdate: 'TransactionUpdate',
    TransactionDelete: 'TransactionDelete',
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

export type PersonType = (typeof PERSON_TYPE)[keyof typeof PERSON_TYPE];

export const GENDER = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const ACCOUNT_TYPE_CODE = {
    CUSTOMER: 'CUSTOMER', // Müşteri
    SUPPLIER: 'SUPPLIER', // Tedarikçi
    CONTRACTOR: 'CONTRACTOR', // Müteahhit
    PARTNER: 'PARTNER', // İş Ortağı
    COMPETITOR: 'COMPETITOR', // Rakip
    CONSULTANT: 'CONSULTANT', // Danışman
    OTHER: 'OTHER', // Diğer
} as const;

export type AccountTypeCode = (typeof ACCOUNT_TYPE_CODE)[keyof typeof ACCOUNT_TYPE_CODE];
