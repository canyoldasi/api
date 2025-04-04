import { registerEnumType } from '@nestjs/graphql';

export const PERMISSIONS = {
    UserCreate: 'UserCreate',
    UserRead: 'UserRead',
    UserUpdate: 'UserUpdate',
    UserDelete: 'UserDelete',
    RoleCreate: 'RoleCreate',
    RoleRead: 'RoleRead',
    RoleUpdate: 'RoleUpdate',
    RoleDelete: 'RoleDelete',
    AccountCreate: 'AccountCreate',
    AccountRead: 'AccountRead',
    AccountUpdate: 'AccountUpdate',
    AccountDelete: 'AccountDelete',
    TransactionCreate: 'TransactionCreate',
    TransactionRead: 'TransactionRead',
    TransactionUpdate: 'TransactionUpdate',
    TransactionDelete: 'TransactionDelete',
    SettingCreate: 'SettingCreate',
    SettingRead: 'SettingRead',
    SettingUpdate: 'SettingUpdate',
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Register the Permission type for GraphQL
registerEnumType(PERMISSIONS, {
    name: 'Permission',
    description: 'Available permissions in the system',
});

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

export const CHANNEL_CODE = {
    BOOKING: 'BOOKING',
    GOOGLE: 'GOOGLE',
    TRIVAGO: 'TRIVAGO',
    DIRECT: 'DIRECT',
} as const;

export type ChannelCode = (typeof CHANNEL_CODE)[keyof typeof CHANNEL_CODE];
