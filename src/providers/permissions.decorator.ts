import { SetMetadata } from '@nestjs/common';
import { METADATA_NAME_PERMISSIONS, Permission } from 'src/constants';
import FastifyRequestCustom from './fastify-request-custom';

export const Permissions = (...permissions: Permission[]) => SetMetadata(METADATA_NAME_PERMISSIONS, permissions);

export const HasPermissions = (permissions: Permission[]) => {
    return (request: FastifyRequestCustom) => {
        const userPermissions = request.user?.permissions || [];
        return permissions.every((permission) => userPermissions.includes(permission));
    };
};
