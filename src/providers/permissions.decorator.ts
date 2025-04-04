import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_METADATA_NAME, Permission } from 'src/types/constants';

export const Permissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_METADATA_NAME, permissions);
