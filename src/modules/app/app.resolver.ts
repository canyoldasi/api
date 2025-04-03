import { Resolver, Query } from '@nestjs/graphql';
import { Field, ObjectType } from '@nestjs/graphql';
import { SettingService } from '../setting/setting.service';

@ObjectType()
class AppInfo {
    @Field(() => String)
    name: string;

    @Field(() => String)
    logo: string;
}

@Resolver()
export class AppResolver {
    constructor(private readonly settingService: SettingService) {}

    @Query(() => AppInfo)
    async appInfo(): Promise<AppInfo> {
        const appNameSetting = await this.settingService.getSetting('APP_NAME');
        const appLogoSetting = await this.settingService.getSetting('APP_LOGO');

        return {
            name: appNameSetting?.value || 'Kurum Adı',
            logo: appLogoSetting?.value || '',
        };
    }
}
