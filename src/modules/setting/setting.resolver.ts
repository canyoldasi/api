import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SettingService } from './setting.service';
import { Setting } from '../../entities/setting.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Permissions } from '../../providers/permissions.decorator';
import { PERMISSIONS } from '../../types/constants';

@Resolver(() => Setting)
@UseGuards(AuthGuard)
export class SettingResolver {
    constructor(private readonly settingService: SettingService) {}

    @Query(() => Setting, { nullable: true })
    @Permissions(PERMISSIONS.SettingRead)
    async getSetting(@Args('key') key: string): Promise<Setting | null> {
        return this.settingService.getSetting(key);
    }

    @Mutation(() => Setting)
    @Permissions(PERMISSIONS.SettingCreate)
    async createSetting(@Args('key') key: string, @Args('value') value: string): Promise<Setting> {
        return this.settingService.createSetting(key, value);
    }

    @Mutation(() => Setting)
    @Permissions(PERMISSIONS.SettingUpdate)
    async updateSetting(@Args('key') key: string, @Args('value') value: string): Promise<Setting> {
        return this.settingService.updateSetting(key, value);
    }
}
