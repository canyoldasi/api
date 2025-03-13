import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_METADATA_NAME, Permission } from 'src/constants';
import FastifyRequestCustom from './fastify-request-custom';

export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_METADATA_NAME, permissions);

export const HasPermissions = (permissions: Permission[]) => {
    return (request: FastifyRequestCustom) => {
        const userPermissions = request.user?.permissions || [];
        return permissions.every((permission) => userPermissions.includes(permission));
    };
};
