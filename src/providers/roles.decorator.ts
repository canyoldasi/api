import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from './role.enum';
import { METADATA_NAME_ROLES } from 'src/constants';

export const Roles = (...roles: RoleEnum[]) => SetMetadata(METADATA_NAME_ROLES, roles);
