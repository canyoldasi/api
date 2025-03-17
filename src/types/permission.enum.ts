import { registerEnumType } from '@nestjs/graphql';

export enum PermissionEnum {
    UserRead = 'UserRead',
    UserCreate = 'UserCreate',
    UserUpdate = 'UserUpdate',
    UserDelete = 'UserDelete',
    RoleRead = 'RoleRead',
    RoleCreate = 'RoleCreate',
    RoleUpdate = 'RoleUpdate',
    RoleDelete = 'RoleDelete',
}

registerEnumType(PermissionEnum, {
    name: 'Permission',
    description: 'Available permissions in the system',
});
//TODO: bu enum kod tekrarı olduğu için kaldırılacak