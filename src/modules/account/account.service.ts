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
import { Segment } from '../../entities/segment.entity';
import { DeepPartial } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Country } from '../../entities/country.entity';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { Channel } from '../../entities/channel.entity';

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
                channel: dto.channelId ? { id: dto.channelId } : null,
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
            // Sadece gönderilen alanları içeren bir obje oluştur
            const updateData: DeepPartial<Account> = {};

            // Her alan için kontrol et ve sadece gönderilen alanları güncelle
            if (dto.personType !== undefined) {
                updateData.personType = dto.personType;
            }

            if (dto.channelId !== undefined) {
                updateData.channel = dto.channelId ? ({ id: dto.channelId } as DeepPartial<Channel>) : null;
            }

            if (dto.name !== undefined) {
                updateData.name = dto.name;
            }

            if (dto.firstName !== undefined) {
                updateData.firstName = dto.firstName;
            }

            if (dto.lastName !== undefined) {
                updateData.lastName = dto.lastName;
            }

            if (dto.email !== undefined) {
                updateData.email = dto.email;
            }

            if (dto.phone !== undefined) {
                updateData.phone = dto.phone;
            }

            if (dto.phone2 !== undefined) {
                updateData.phone2 = dto.phone2;
            }

            if (dto.gender !== undefined) {
                updateData.gender = dto.gender;
            }

            if (dto.taxNumber !== undefined) {
                updateData.taxNumber = dto.taxNumber;
            }

            if (dto.taxOffice !== undefined) {
                updateData.taxOffice = dto.taxOffice;
            }

            if (dto.nationalId !== undefined) {
                updateData.nationalId = dto.nationalId;
            }

            if (dto.address !== undefined) {
                updateData.address = dto.address;
            }

            if (dto.postalCode !== undefined) {
                updateData.postalCode = dto.postalCode;
            }

            if (dto.note !== undefined) {
                updateData.note = dto.note;
            }

            // İlişkili alanlar için kontroller
            if (dto.assignedUserId !== undefined) {
                updateData.assignedUser = dto.assignedUserId ? ({ id: dto.assignedUserId } as DeepPartial<User>) : null;
            }

            if (dto.countryId !== undefined) {
                updateData.country = dto.countryId ? ({ id: dto.countryId } as DeepPartial<Country>) : null;
            }

            if (dto.cityId !== undefined) {
                updateData.city = dto.cityId ? ({ id: dto.cityId } as DeepPartial<City>) : null;
            }

            if (dto.countyId !== undefined) {
                updateData.county = dto.countyId ? ({ id: dto.countyId } as DeepPartial<County>) : null;
            }

            if (dto.districtId !== undefined) {
                updateData.district = dto.districtId ? ({ id: dto.districtId } as DeepPartial<District>) : null;
            }

            // Temel account nesnesini güncelle
            const updatedAccount = await manager.save(Account, {
                id: dto.id,
                ...updateData,
            });
            accountId = updatedAccount.id;

            // AccountType ilişkileri için kontrol
            if (dto.accountTypeIds !== undefined) {
                // Mevcut ilişkileri sil
                await manager.delete(AccountAccountType, { account: { id: accountId } });

                // Yeni ilişkileri ekle
                if (dto.accountTypeIds.length > 0) {
                    const accountAccountTypes = dto.accountTypeIds.map((id) => ({
                        account: { id: accountId },
                        accountType: { id },
                    }));

                    await manager.save(AccountAccountType, accountAccountTypes);
                }
            }

            // Locations için kontrol
            if (dto.locations !== undefined) {
                // Mevcut lokasyonları sil
                await manager.delete(AccountLocation, { account: { id: accountId } });

                // Yeni lokasyonları ekle
                if (dto.locations.length > 0) {
                    const accountLocations = dto.locations.map((location) => ({
                        account: { id: accountId },
                        country: { id: location.countryId },
                        city: location.cityId ? { id: location.cityId } : null,
                        county: location.countyId ? { id: location.countyId } : null,
                        district: location.districtId ? { id: location.districtId } : null,
                    }));

                    await manager.save(AccountLocation, accountLocations);
                }
            }

            // Segments için kontrol
            if (dto.segmentIds !== undefined) {
                // Mevcut segment ilişkilerini sil
                await manager.delete(AccountSegment, { account: { id: accountId } });

                // Yeni segment ilişkilerini ekle
                if (dto.segmentIds.length > 0) {
                    const accountSegments = dto.segmentIds.map((id) => ({
                        account: { id: accountId },
                        segment: { id },
                    }));

                    await manager.save(AccountSegment, accountSegments);
                }
            }

            this.logger.log(`Account updated: ${updatedAccount.id}`);
        });

        return this.getOne(accountId);
    }

    async delete(id: string): Promise<boolean> {
        // Fiziksel silme yerine deletedAt alanını güncelliyoruz (soft delete)
        await this.entityManager.update(Account, id, {
            deletedAt: new Date(),
        });
        return true;
    }

    async getOne(id: string): Promise<Account> {
        return await this.entityManager.findOne(Account, {
            where: {
                id,
                deletedAt: null,
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
                'transactions',
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
            .leftJoinAndSelect('locations.district', 'locationDistrict')
            .leftJoinAndSelect('account.channel', 'channel');

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

        if (filters.channelIds?.length > 0) {
            queryBuilder.andWhere('channel.id IN (:...channelIds)', { channelIds: filters.channelIds });
        }

        if (filters.assignedUserId) {
            queryBuilder.andWhere('assignedUser.id = :assignedUserId', {
                assignedUserId: filters.assignedUserId,
            });
        }

        if (filters.countryId) {
            queryBuilder.andWhere('country.id = :countryId', { countryId: filters.countryId });
        }

        if (filters.cityIds?.length > 0) {
            queryBuilder.andWhere('city.id IN (:...cityIds)', { cityIds: filters.cityIds });
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
    async getAccountTypesLookup(): Promise<AccountType[]> {
        return this.entityManager.find(AccountType, {
            where: {
                deletedAt: null,
                isActive: true,
            },
            order: {
                name: 'ASC',
            },
        });
    }

    async getSegmentsLookup(): Promise<Segment[]> {
        return this.entityManager.find(Segment, {
            where: {
                isActive: true,
                deletedAt: null,
            },
            order: {
                name: 'ASC',
            },
        });
    }
}
