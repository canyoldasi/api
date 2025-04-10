import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Setting } from '../../entities/setting.entity';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { In } from 'typeorm';

@Injectable()
export class SettingService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async updateSetting(key: string, value: string): Promise<Setting> {
        const existingSetting = await this.entityManager.findOne(Setting, {
            where: { key },
        });

        if (!existingSetting) {
            throw new Error(`Setting with key ${key} not found`);
        }

        const setting = this.entityManager.create(Setting, {
            key,
            value,
            previousValue: existingSetting.value,
            updatedAt: new Date(),
        });

        await this.entityManager.save(Setting, setting);
        return setting;
    }

    async getSetting(key: string): Promise<Setting | null> {
        return this.entityManager.findOne(Setting, {
            where: { key },
        });
    }

    async getSettings(keys: string[]): Promise<(string | null)[]> {
        const settings = await this.entityManager.find(Setting, {
            where: { key: In(keys) },
        });
        const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));

        return keys.map((key) => settingsMap.get(key) || null);
    }
}
