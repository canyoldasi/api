import { Global, Module } from '@nestjs/common';
import { SettingResolver } from './setting.resolver';
import { SettingService } from './setting.service';
import { UserModule } from '../user/user.module';

@Global()
@Module({
    imports: [UserModule],
    providers: [SettingResolver, SettingService],
    exports: [SettingService],
})
export class SettingModule {}
