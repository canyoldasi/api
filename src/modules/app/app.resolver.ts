import { Query, Resolver, ObjectType, Field } from '@nestjs/graphql';
import { SettingService } from '../setting/setting.service';
import { LanguageService } from './language.service';
import { Language } from '../../entities/language.entity';

@ObjectType()
class AppInfo {
    @Field(() => String, { nullable: true })
    name: string;

    @Field(() => String, { nullable: true })
    logo: string;
}

@Resolver()
export class AppResolver {
    constructor(
        private readonly settingService: SettingService,
        private readonly languageService: LanguageService
    ) {}

    @Query(() => AppInfo)
    async getApp(): Promise<AppInfo> {
        return {
            name: (await this.settingService.getSetting('app_name'))?.value || 'Kurum Adı',
            logo: (await this.settingService.getSetting('app_logo'))?.value || '',
        };
    }

    @Query(() => [Language])
    async getLanguages(): Promise<Language[]> {
        return this.languageService.getActiveLanguages();
    }
}
