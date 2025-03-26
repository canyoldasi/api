import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../entities/transaction.entity';
import { EntityManager, DeepPartial } from 'typeorm';
import { CreateUpdateTransactionDTO } from './dto/create-update-transaction.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetTransactionsDTO } from './dto/get-transactions.dto';
import { PaginatedResult } from '../../types/paginated';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { TransactionProduct } from '../../entities/transaction-product.entity';
import { TransactionType } from '../../entities/transaction-type.entity';
import { Account } from '../../entities/account.entity';
import { User } from '../../entities/user.entity';
import { Country } from '../../entities/country.entity';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../entities/channel.entity';

@Injectable()
export class TransactionService {
    private channelsLookup: { [key: string]: Channel } | null = null;

    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger,
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(Channel)
        private channelRepository: Repository<Channel>
    ) {}

    async create(dto: CreateUpdateTransactionDTO): Promise<Transaction> {
        let toSave = null;

        await this.entityManager.transaction(async (manager) => {
            // Temel transaction nesnesini kaydet
            const createData: DeepPartial<Transaction> = {
                ...dto,
                account: dto.accountId ? ({ id: dto.accountId } as DeepPartial<Account>) : null,
                status: dto.statusId ? ({ id: dto.statusId } as DeepPartial<TransactionStatus>) : null,
                type: dto.typeId ? ({ id: dto.typeId } as DeepPartial<TransactionType>) : null,
                channel: dto.channelId ? ({ id: dto.channelId } as DeepPartial<Channel>) : null,
                assignedUser: dto.assignedUserId ? ({ id: dto.assignedUserId } as DeepPartial<User>) : null,
                country: dto.countryId ? { id: dto.countryId } : null,
                city: dto.cityId ? { id: dto.cityId } : null,
                county: dto.countyId ? { id: dto.countyId } : null,
                district: dto.districtId ? { id: dto.districtId } : null,
            };

            const savedEntity = await manager.save(Transaction, createData);
            toSave = savedEntity;

            // Transaction ürünlerini kaydet
            if (dto.products && dto.products.length > 0) {
                const transactionProducts = dto.products.map((product) => ({
                    transaction: { id: savedEntity.id },
                    product: { id: product.productId },
                    quantity: product.quantity,
                    unitPrice: product.unitPrice,
                    totalPrice:
                        product.totalPrice ||
                        (product.quantity && product.unitPrice ? product.quantity * product.unitPrice : null),
                }));

                await manager.save(TransactionProduct, transactionProducts);
            }
        });

        return toSave ? this.getOne(toSave.id) : null;
    }

    async update(dto: CreateUpdateTransactionDTO): Promise<Transaction> {
        await this.entityManager.transaction(async (manager) => {
            // Sadece gönderilen alanları içeren bir obje oluştur
            const updateData: DeepPartial<Transaction> = {};

            // Her alan için kontrol et ve sadece gönderilen alanları güncelle
            if (dto.typeId !== undefined) {
                updateData.type = { id: dto.typeId } as DeepPartial<TransactionType>;
            }

            if (dto.statusId !== undefined) {
                updateData.status = { id: dto.statusId } as DeepPartial<TransactionStatus>;
            }

            if (dto.channelId !== undefined) {
                updateData.channel = dto.channelId ? ({ id: dto.channelId } as DeepPartial<Channel>) : null;
            }

            if (dto.accountId !== undefined) {
                updateData.account = dto.accountId ? ({ id: dto.accountId } as DeepPartial<Account>) : null;
            }

            if (dto.assignedUserId !== undefined) {
                updateData.assignedUser = dto.assignedUserId ? ({ id: dto.assignedUserId } as DeepPartial<User>) : null;
            }

            if (dto.amount !== undefined) {
                updateData.amount = dto.amount;
            }

            if (dto.no !== undefined) {
                updateData.no = dto.no;
            }

            if (dto.successDate !== undefined) {
                updateData.successDate = dto.successDate;
            }

            if (dto.cancelDate !== undefined) {
                updateData.cancelDate = dto.cancelDate;
            }

            if (dto.cancelNote !== undefined) {
                updateData.cancelNote = dto.cancelNote;
            }

            if (dto.successNote !== undefined) {
                updateData.successNote = dto.successNote;
            }

            if (dto.note !== undefined) {
                updateData.note = dto.note;
            }

            // Lokasyon alanları için kontroller
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

            if (dto.postalCode !== undefined) {
                updateData.postalCode = dto.postalCode;
            }

            // Transaction'ı güncelle
            await manager.save(Transaction, {
                id: dto.id,
                ...updateData,
            });

            // Products için özel kontrol
            if (dto.products !== undefined) {
                // Mevcut ürünleri sil
                await manager.delete(TransactionProduct, { transaction: { id: dto.id } });

                // Eğer products array'i boş değilse yeni ürünleri ekle
                if (dto.products.length > 0) {
                    const transactionProducts = dto.products.map((product) => ({
                        transaction: { id: dto.id },
                        product: { id: product.productId },
                        quantity: product.quantity,
                        unitPrice: product.unitPrice,
                        totalPrice:
                            product.totalPrice ||
                            (product.quantity && product.unitPrice ? product.quantity * product.unitPrice : null),
                    }));

                    await manager.save(TransactionProduct, transactionProducts);
                }
            }

            this.logger.log(`Transaction updated: ${dto.id}`);
        });

        return this.getOne(dto.id);
    }

    async delete(id: string): Promise<boolean> {
        // Fiziksel silme yerine deletedAt alanını güncelliyoruz (soft delete)
        await this.entityManager.update(Transaction, id, {
            deletedAt: new Date(),
        });
        return true;
    }

    async getOne(id: string): Promise<Transaction> {
        const result = await this.entityManager
            .createQueryBuilder(Transaction, 'transaction')
            .leftJoinAndSelect('transaction.account', 'account')
            .leftJoinAndSelect('transaction.status', 'status')
            .leftJoinAndSelect('transaction.type', 'type')
            .leftJoinAndSelect('transaction.assignedUser', 'user')
            .leftJoinAndSelect('transaction.transactionProducts', 'transactionProducts')
            .leftJoinAndSelect('transactionProducts.product', 'product')
            .leftJoinAndSelect('transaction.country', 'country')
            .leftJoinAndSelect('transaction.city', 'city')
            .leftJoinAndSelect('transaction.county', 'county')
            .leftJoinAndSelect('transaction.district', 'district')
            .where('transaction.id = :id', { id })
            .andWhere('transaction.deletedAt IS NULL')
            .getOne();
        return result;
    }

    async getTransactionsByFilters(filters: GetTransactionsDTO): Promise<PaginatedResult<Transaction>> {
        const queryBuilder = this.entityManager
            .createQueryBuilder(Transaction, 'transaction')
            .leftJoinAndSelect('transaction.account', 'account')
            .leftJoinAndSelect('transaction.status', 'status')
            .leftJoinAndSelect('transaction.type', 'type')
            .leftJoinAndSelect('transaction.assignedUser', 'user')
            .leftJoinAndSelect('transaction.transactionProducts', 'transactionProducts')
            .leftJoinAndSelect('transactionProducts.product', 'product')
            .leftJoinAndSelect('transaction.country', 'country')
            .leftJoinAndSelect('transaction.city', 'city')
            .leftJoinAndSelect('transaction.county', 'county')
            .leftJoinAndSelect('transaction.district', 'district')
            .leftJoinAndSelect('transaction.channel', 'channel')
            .where('transaction.deletedAt IS NULL');

        // Filtreleri uygula
        if (filters.text) {
            queryBuilder.andWhere(
                '(transaction.no LIKE :text OR transaction.note LIKE :text OR transaction.address LIKE :text)',
                { text: `%${filters.text}%` }
            );
        }

        if (filters.typeIds?.length > 0) {
            queryBuilder.andWhere('type.id IN (:...typeIds)', { typeIds: filters.typeIds });
        }

        if (filters.statusIds?.length > 0) {
            queryBuilder.andWhere('status.id IN (:...statusIds)', { statusIds: filters.statusIds });
        }

        if (filters.channelIds?.length > 0) {
            queryBuilder.andWhere('channel.id IN (:...channelIds)', { channelIds: filters.channelIds });
        }

        if (filters.accountId) {
            queryBuilder.andWhere('account.id = :accountId', { accountId: filters.accountId });
        }

        if (filters.amountStart !== undefined) {
            queryBuilder.andWhere('transaction.amount >= :amountStart', { amountStart: filters.amountStart });
        }

        if (filters.amountEnd !== undefined) {
            queryBuilder.andWhere('transaction.amount <= :amountEnd', { amountEnd: filters.amountEnd });
        }

        if (filters.assignedUserIds?.length > 0) {
            queryBuilder.andWhere('user.id IN (:...assignedUserIds)', { assignedUserIds: filters.assignedUserIds });
        }

        if (filters.countryId) {
            queryBuilder.andWhere('country.id = :countryId', { countryId: filters.countryId });
        }

        if (filters.cityIds?.length > 0) {
            queryBuilder.andWhere('city.id IN (:...cityIds)', { cityIds: filters.cityIds });
        }

        if (filters.createdAtStart) {
            queryBuilder.andWhere('transaction.createdAt >= :createdAtStart', {
                createdAtStart: new Date(filters.createdAtStart),
            });
        }

        if (filters.createdAtEnd) {
            queryBuilder.andWhere('transaction.createdAt <= :createdAtEnd', {
                createdAtEnd: new Date(filters.createdAtEnd),
            });
        }

        if (filters.successDateStart) {
            queryBuilder.andWhere('transaction.successDate >= :successDateStart', {
                successDateStart: new Date(filters.successDateStart),
            });
        }

        if (filters.successDateEnd) {
            queryBuilder.andWhere('transaction.successDate <= :successDateEnd', {
                successDateEnd: new Date(filters.successDateEnd),
            });
        }

        if (filters.cancelDateStart) {
            queryBuilder.andWhere('transaction.cancelDate >= :cancelDateStart', {
                cancelDateStart: new Date(filters.cancelDateStart),
            });
        }

        if (filters.cancelDateEnd) {
            queryBuilder.andWhere('transaction.cancelDate <= :cancelDateEnd', {
                cancelDateEnd: new Date(filters.cancelDateEnd),
            });
        }

        // Get total count before applying pagination
        const itemCount = await queryBuilder.getCount();

        // Calculate page count
        const pageSize = filters.pageSize || itemCount; // If no pageSize, assume all items on one page
        const pageCount = pageSize > 0 ? Math.ceil(itemCount / pageSize) : 0;

        // Sıralama
        queryBuilder.orderBy(`transaction.${filters.orderBy || 'createdAt'}`, filters.orderDirection);

        // Sayfalama
        if (filters.pageSize) {
            queryBuilder.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        // Sonuçları getir
        const items = await queryBuilder.getMany();

        return {
            items,
            itemCount,
            pageCount,
        };
    }

    async getTransactionStatuses(): Promise<TransactionStatus[]> {
        return this.entityManager.find(TransactionStatus, {
            where: { isActive: true },
            order: { sequence: 'ASC' },
        });
    }

    async getTransactionTypesLookup(): Promise<TransactionType[]> {
        return this.entityManager.find(TransactionType, {
            order: { sequence: 'ASC' },
        });
    }

    async getChannelsLookup(): Promise<Channel[]> {
        return this.channelRepository.find();
    }
}
