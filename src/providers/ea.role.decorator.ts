import { SetMetadata } from '@nestjs/common';
import { EARole } from './ea-role.enum';

export const EARequiredRoles = (...roles: EARole[]) => SetMetadata('EARequiredRoles', roles);
