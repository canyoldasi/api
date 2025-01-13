import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

export const Roles = (...roles: Role[]) => SetMetadata(process.env.METADATA_ROLES, roles);
