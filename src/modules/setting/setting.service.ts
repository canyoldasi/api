import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Setting } from '../../entities/setting.entity';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

@Injectable()
export class SettingService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async createSetting(key: string, value: string): Promise<Setting> {
        const setting = this.entityManager.create(Setting, {
            key,
            value,
            updatedAt: new Date(),
        });

        await this.entityManager.save(Setting, setting);
        return setting;
    }

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

    async getValue(key: string): Promise<string | null> {
        const setting = await this.getSetting(key);
        return setting ? setting.value : null;
    }

    async getValues(keys: string[]): Promise<Record<string, string | null>> {
        const result: Record<string, string | null> = {};

        // Initialize all requested keys with null
        keys.forEach((key) => {
            result[key] = null;
        });

        // Fill in the values from found settings
        for (const key of keys) {
            const setting = await this.getSetting(key);
            if (setting) {
                result[key] = setting.value;
            }
        }

        return result;
    }
}
