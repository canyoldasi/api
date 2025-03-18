import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../entities/account.entity';
import { EntityManager } from 'typeorm';
import { CreateUpdateAccountDTO } from './dto/create-update-account.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetAccountsDTO } from './dto/get-accounts.dto';
import { AccountLocation } from '../../entities/account-location.entity';

@Injectable()
export class AccountService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async create(dto: CreateUpdateAccountDTO): Promise<Account> {
        let toSave = null;

        await this.entityManager.transaction(async (manager) => {
            // Önce temel account nesnesini kaydet (locations olmadan)
            toSave = {
                ...dto,
                accountTypes: dto.accountTypeIds?.map((id) => ({ id })),
                segments: dto.segmentIds?.map((id) => ({ id })),
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
                country: dto.countryId ? { id: dto.countryId } : null,
                city: dto.cityId ? { id: dto.cityId } : null,
                county: dto.countyId ? { id: dto.countyId } : null,
                district: dto.districtId ? { id: dto.districtId } : null,
            };

            const savedEntity = await manager.save(Account, toSave);

            // Locations varsa ayrıca kaydet
            if (dto.locations?.length) {
                const accountLocations = dto.locations.map((location) => ({
                    account: { id: savedEntity.id },
                    country: { id: location.countryId },
                    city: location.cityId ? { id: location.cityId } : null,
                    county: location.countyId ? { id: location.countyId } : null,
                    district: location.districtId ? { id: location.districtId } : null,
                }));

                await manager.save(AccountLocation, accountLocations);
            }
        });

        return toSave.id ? this.getOne(toSave.id) : null;
    }

    async update(dto: CreateUpdateAccountDTO): Promise<Account> {
        let accountId: string;

        await this.entityManager.transaction(async (manager) => {
            // İlişkili tablolardaki mevcut kayıtları sil
            if (dto.accountTypeIds) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from('account_account_type')
                    .where('account_id = :accountId', { accountId: dto.id })
                    .execute();
            }

            if (dto.segmentIds) {
                await manager
                    .createQueryBuilder()
                    .delete()
                    .from('account_segment')
                    .where('account_id = :accountId', { accountId: dto.id })
                    .execute();
            }

            if (dto.locations) {
                await manager.delete(AccountLocation, { account: { id: dto.id } });
            }

            // Temel account nesnesini güncelle
            const toUpdate = {
                ...dto,
                accountTypes: dto.accountTypeIds?.map((id) => ({ id })),
                segments: dto.segmentIds?.map((id) => ({ id })),
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
                country: dto.countryId ? { id: dto.countryId } : null,
                city: dto.cityId ? { id: dto.cityId } : null,
                county: dto.countyId ? { id: dto.countyId } : null,
                district: dto.districtId ? { id: dto.districtId } : null,
            };

            const updatedAccount = await manager.save(Account, toUpdate);
            accountId = updatedAccount.id;

            // Locations varsa ayrıca ekle
            if (dto.locations?.length) {
                const accountLocations = dto.locations.map((location) => ({
                    account: { id: accountId },
                    country: { id: location.countryId },
                    city: location.cityId ? { id: location.cityId } : null,
                    county: location.countyId ? { id: location.countyId } : null,
                    district: location.districtId ? { id: location.districtId } : null,
                }));

                await manager.save(AccountLocation, accountLocations);
            }

            this.logger.log(`Account updated: ${updatedAccount.id}`);
        });

        return this.getOne(accountId);
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
                'locations.country',
                'locations.city',
                'locations.county',
                'locations.district',
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
            .leftJoinAndSelect('account.district', 'district')
            .leftJoinAndSelect('account.locations', 'locations')
            .leftJoinAndSelect('locations.country', 'locationCountry')
            .leftJoinAndSelect('locations.city', 'locationCity')
            .leftJoinAndSelect('locations.county', 'locationCounty');

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
