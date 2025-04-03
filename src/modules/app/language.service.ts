import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Language } from '../../entities/language.entity';

@Injectable()
export class LanguageService {
    constructor(@Inject(EntityManager) private entityManager: EntityManager) {}

    async getActiveLanguages(): Promise<Language[]> {
        return this.entityManager.find(Language, {
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }
}
