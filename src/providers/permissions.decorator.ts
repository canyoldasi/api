import { SetMetadata } from '@nestjs/common';
import { METADATA_NAME_PERMISSIONS, Permission } from 'src/constants';

export const Permissions = (...permissions: Permission[]) => SetMetadata(METADATA_NAME_PERMISSIONS, permissions);
