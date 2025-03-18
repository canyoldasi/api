import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../entities/account.entity';
import { EntityManager } from 'typeorm';
import { CreateUpdateAccountDTO } from './dto/create-update-account.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetAccountsDTO } from './dto/get-accounts.dto';

@Injectable()
export class AccountService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async create(dto: CreateUpdateAccountDTO): Promise<Account> {
        let accountId: string;

        await this.entityManager.transaction(async (manager) => {
            const savedAccount = await manager.save(Account, {
                ...dto,
                accountTypes: dto.accountTypeIds?.map((id) => ({ id })),
                segments: dto.segmentIds?.map((id) => ({ id })),
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
            });
            accountId = savedAccount.id;
        });

        return this.getOne(accountId);
    }

    async update(dto: CreateUpdateAccountDTO): Promise<Account> {
        let ret: Account;

        await this.entityManager.transaction(async (manager) => {
            ret = await manager.save(Account, {
                ...dto,
                accountTypes: dto.accountTypeIds?.map((id) => ({ id })),
                segments: dto.segmentIds?.map((id) => ({ id })),
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
            });
            this.logger.log(`Account updated: ${ret}`);
        });

        return ret;
    }

    async delete(id: string): Promise<boolean> {
        await this.entityManager.delete(Account, {
            id,
        });
        return true;
    }

    async getOne(id: string): Promise<Account> {
        return await this.entityManager.findOne(Account, {
            where: {
                id,
            },
            relations: [
                'accountTypes',
                'segments',
                'assignedUser',
                'country',
                'city',
                'county',
                'district',
                'contacts',
                'opportunities',
                'locations',
            ],
        });
    }

    async getAccountsByFilters(filters: GetAccountsDTO): Promise<Account[]> {
        const queryBuilder = this.entityManager
            .createQueryBuilder(Account, 'account')
            .leftJoinAndSelect('account.accountTypes', 'accountTypes')
            .leftJoinAndSelect('account.segments', 'segments')
            .leftJoinAndSelect('account.assignedUser', 'assignedUser')
            .leftJoinAndSelect('account.country', 'country')
            .leftJoinAndSelect('account.city', 'city')
            .leftJoinAndSelect('account.county', 'county')
            .leftJoinAndSelect('account.district', 'district');

        queryBuilder.where('account.deletedAt IS NULL');

        if (filters.text) {
            queryBuilder.andWhere(
                '(account.name ILIKE :text OR account.firstName ILIKE :text OR account.lastName ILIKE :text OR account.email ILIKE :text OR account.phone ILIKE :text)',
                { text: `%${filters.text}%` }
            );
        }

        if (filters.type) {
            queryBuilder.andWhere('account.type = :type', { type: filters.type });
        }

        if (filters.gender) {
            queryBuilder.andWhere('account.gender = :gender', { gender: filters.gender });
        }

        if (filters.assignedUserId) {
            queryBuilder.andWhere('account.assignedUserId = :assignedUserId', {
                assignedUserId: filters.assignedUserId,
            });
        }

        if (filters.countryId) {
            queryBuilder.andWhere('account.countryId = :countryId', { countryId: filters.countryId });
        }

        if (filters.cityId) {
            queryBuilder.andWhere('account.cityId = :cityId', { cityId: filters.cityId });
        }

        if (filters.countyId) {
            queryBuilder.andWhere('account.countyId = :countyId', { countyId: filters.countyId });
        }

        if (filters.districtId) {
            queryBuilder.andWhere('account.districtId = :districtId', { districtId: filters.districtId });
        }

        if (filters.accountTypeIds?.length > 0) {
            queryBuilder.andWhere('accountTypes.id IN (:...accountTypeIds)', {
                accountTypeIds: filters.accountTypeIds,
            });
        }

        if (filters.segmentIds?.length > 0) {
            queryBuilder.andWhere('segments.id IN (:...segmentIds)', {
                segmentIds: filters.segmentIds,
            });
        }

        if (filters.createdAtStart) {
            queryBuilder.andWhere('account.createdAt >= :createdAtStart', {
                createdAtStart: filters.createdAtStart,
            });
        }

        if (filters.createdAtEnd) {
            queryBuilder.andWhere('account.createdAt <= :createdAtEnd', {
                createdAtEnd: filters.createdAtEnd,
            });
        }

        queryBuilder.orderBy(`account.${filters.orderBy || 'name'}`, filters.orderDirection);

        if (filters.pageSize) {
            queryBuilder.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        return await queryBuilder.getMany();
    }
}
