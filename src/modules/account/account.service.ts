import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../entities/account.entity';
import { EntityManager } from 'typeorm';
import { CreateUpdateAccountDTO } from './dto/create-update-account.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetAccountsDTO } from './dto/get-accounts.dto';
import { AccountLocation } from '../../entities/account-location.entity';
import { AccountSegment } from '../../entities/account-segment.entity';
import { AccountAccountType } from '../../entities/account-account-type.entity';
import { PaginatedResult } from '../../types/paginated';
import { AccountType } from '../../entities/account-type.entity';

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
            // Önce temel account nesnesini kaydet (ilişkiler olmadan)
            toSave = {
                ...dto,
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
                country: dto.countryId ? { id: dto.countryId } : null,
                city: dto.cityId ? { id: dto.cityId } : null,
                county: dto.countyId ? { id: dto.countyId } : null,
                district: dto.districtId ? { id: dto.districtId } : null,
            };

            const savedEntity = await manager.save(Account, toSave);

            // AccountType ilişkileri kaydet
            if (dto.accountTypeIds?.length) {
                const accountAccountTypes = dto.accountTypeIds.map((id) => ({
                    account: { id: savedEntity.id },
                    accountType: { id },
                }));

                await manager.save(AccountAccountType, accountAccountTypes);
            }

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

            // Segments varsa ayrıca kaydet
            if (dto.segmentIds?.length) {
                const accountSegments = dto.segmentIds.map((id) => ({
                    account: { id: savedEntity.id },
                    segment: { id },
                }));

                await manager.save(AccountSegment, accountSegments);
            }
        });

        return toSave.id ? this.getOne(toSave.id) : null;
    }

    async update(dto: CreateUpdateAccountDTO): Promise<Account> {
        let accountId: string;

        await this.entityManager.transaction(async (manager) => {
            // İlişkili tablolardaki mevcut kayıtları sil
            if (dto.accountTypeIds) {
                await manager.delete(AccountAccountType, { account: { id: dto.id } });
            }

            if (dto.segmentIds) {
                await manager.delete(AccountSegment, { account: { id: dto.id } });
            }

            if (dto.locations) {
                await manager.delete(AccountLocation, { account: { id: dto.id } });
            }

            // Temel account nesnesini güncelle
            const toUpdate = {
                ...dto,
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
                country: dto.countryId ? { id: dto.countryId } : null,
                city: dto.cityId ? { id: dto.cityId } : null,
                county: dto.countyId ? { id: dto.countyId } : null,
                district: dto.districtId ? { id: dto.districtId } : null,
            };

            const updatedAccount = await manager.save(Account, toUpdate);
            accountId = updatedAccount.id;

            // AccountType ilişkilerini ekle
            if (dto.accountTypeIds?.length) {
                const accountAccountTypes = dto.accountTypeIds.map((id) => ({
                    account: { id: accountId },
                    accountType: { id },
                }));

                await manager.save(AccountAccountType, accountAccountTypes);
            }

            // Locations varsa ayrıca kaydet
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

            // Segments varsa ayrıca ekle
            if (dto.segmentIds?.length) {
                const accountSegments = dto.segmentIds.map((id) => ({
                    account: { id: accountId },
                    segment: { id },
                }));

                await manager.save(AccountSegment, accountSegments);
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
                'accountAccountTypes',
                'accountAccountTypes.accountType',
                'segments',
                'segments.segment',
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

    async getAccountsByFilters(filters: GetAccountsDTO): Promise<PaginatedResult<Account>> {
        const queryBuilder = this.entityManager
            .createQueryBuilder(Account, 'account')
            .leftJoinAndSelect('account.accountAccountTypes', 'accountAccountTypes')
            .leftJoinAndSelect('accountAccountTypes.accountType', 'accountType')
            .leftJoinAndSelect('account.segments', 'segments')
            .leftJoinAndSelect('segments.segment', 'segment')
            .leftJoinAndSelect('account.assignedUser', 'assignedUser')
            .leftJoinAndSelect('account.country', 'country')
            .leftJoinAndSelect('account.city', 'city')
            .leftJoinAndSelect('account.county', 'county')
            .leftJoinAndSelect('account.district', 'district')
            .leftJoinAndSelect('account.locations', 'locations')
            .leftJoinAndSelect('locations.country', 'locationCountry')
            .leftJoinAndSelect('locations.city', 'locationCity')
            .leftJoinAndSelect('locations.county', 'locationCounty')
            .leftJoinAndSelect('locations.district', 'locationDistrict');

        queryBuilder.where('account.deletedAt IS NULL');

        if (filters.text) {
            queryBuilder.andWhere(
                '(account.name ILIKE :text OR account.firstName ILIKE :text OR account.lastName ILIKE :text OR account.email ILIKE :text OR account.phone ILIKE :text)',
                { text: `%${filters.text}%` }
            );
        }

        if (filters.personType) {
            queryBuilder.andWhere('account.personType = :personType', { personType: filters.personType });
        }

        if (filters.gender) {
            queryBuilder.andWhere('account.gender = :gender', { gender: filters.gender });
        }

        if (filters.assignedUserId) {
            queryBuilder.andWhere('assignedUser.id = :assignedUserId', {
                assignedUserId: filters.assignedUserId,
            });
        }

        if (filters.countryId) {
            queryBuilder.andWhere('country.id = :countryId', { countryId: filters.countryId });
        }

        if (filters.cityId) {
            queryBuilder.andWhere('city.id = :cityId', { cityId: filters.cityId });
        }

        if (filters.countyId) {
            queryBuilder.andWhere('county.id = :countyId', { countyId: filters.countyId });
        }

        if (filters.districtId) {
            queryBuilder.andWhere('district.id = :districtId', { districtId: filters.districtId });
        }

        if (filters.accountTypeIds?.length > 0) {
            queryBuilder.andWhere('accountType.id IN (:...accountTypeIds)', {
                accountTypeIds: filters.accountTypeIds,
            });
        }

        if (filters.segmentIds?.length > 0) {
            queryBuilder.andWhere('segment.id IN (:...segmentIds)', {
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

        // Get total count before applying pagination
        const itemCount = await queryBuilder.getCount();

        // Calculate page count
        const pageSize = filters.pageSize || itemCount; // If no pageSize, assume all items on one page
        const pageCount = pageSize > 0 ? Math.ceil(itemCount / pageSize) : 0;

        // Apply ordering
        if (filters.orderBy) {
            queryBuilder.orderBy(`account.${filters.orderBy}`, filters.orderDirection);
        } else {
            queryBuilder.orderBy('account.createdAt', 'DESC');
        }

        // Apply pagination
        if (filters.pageSize) {
            queryBuilder.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        const items = await queryBuilder.getMany();
        return { items, itemCount, pageCount };
    }

    /**
     * Tüm aktif AccountType kayıtlarını ada göre sıralı olarak döndürür
     */
    async getAccountTypes(): Promise<AccountType[]> {
        return this.entityManager.find(AccountType, {
            where: {
                deletedAt: null,
            },
            order: {
                name: 'ASC',
            },
        });
    }
}
