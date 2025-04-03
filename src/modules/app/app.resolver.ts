import { Resolver, Query } from '@nestjs/graphql';
import { Field, ObjectType } from '@nestjs/graphql';
import { SettingService } from '../setting/setting.service';
import { LanguageService } from './language.service';
import { Language } from '../../entities/language.entity';

@ObjectType()
class AppInfo {
    @Field(() => String)
    name: string;

    @Field(() => String)
    logo: string;
}

@Resolver()
export class AppResolver {
    constructor(
        private readonly settingService: SettingService,
        private readonly languageService: LanguageService
    ) {}

    @Query(() => AppInfo)
    async appInfo(): Promise<AppInfo> {
        const appNameSetting = await this.settingService.getSetting('APP_NAME');
        const appLogoSetting = await this.settingService.getSetting('APP_LOGO');

        return {
            name: appNameSetting?.value || 'Kurum Adı',
            logo: appLogoSetting?.value || '',
        };
    }

    @Query(() => [Language])
    async getLanguages(): Promise<Language[]> {
        return this.languageService.getActiveLanguages();
    }
}
