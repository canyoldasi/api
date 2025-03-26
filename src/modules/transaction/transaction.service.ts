import { Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../entities/transaction.entity';
import { EntityManager } from 'typeorm';
import { CreateUpdateTransactionDTO } from './dto/create-update-transaction.dto';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { GetTransactionsDTO } from './dto/get-transactions.dto';
import { PaginatedResult } from '../../types/paginated';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { TransactionProduct } from '../../entities/transaction-product.entity';
import { TransactionType } from '../../entities/transaction-type.entity';

@Injectable()
export class TransactionService {
    constructor(
        @Inject(EntityManager) private entityManager: EntityManager,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: WinstonLogger
    ) {}

    async create(dto: CreateUpdateTransactionDTO): Promise<Transaction> {
        let toSave = null;

        await this.entityManager.transaction(async (manager) => {
            // Temel transaction nesnesini kaydet
            toSave = {
                ...dto,
                account: dto.accountId ? { id: dto.accountId } : null,
                status: { id: dto.statusId },
                type: dto.typeId ? { id: dto.typeId } : null,
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
            };

            const savedEntity = await manager.save(Transaction, toSave);
            toSave.id = savedEntity.id;

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

        return toSave.id ? this.getOne(toSave.id) : null;
    }

    async update(dto: CreateUpdateTransactionDTO): Promise<Transaction> {
        await this.entityManager.transaction(async (manager) => {
            // Temel transaction nesnesini güncelle
            const toUpdate = {
                ...dto,
                account: dto.accountId ? { id: dto.accountId } : null,
                status: { id: dto.statusId },
                type: dto.typeId ? { id: dto.typeId } : null,
                assignedUser: dto.assignedUserId ? { id: dto.assignedUserId } : null,
            };

            await manager.save(Transaction, toUpdate);

            // Mevcut transaction ürünlerini sil
            await manager.delete(TransactionProduct, { transaction: { id: dto.id } });

            // Yeni transaction ürünlerini kaydet
            if (dto.products && dto.products.length > 0) {
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
            .where('transaction.deletedAt IS NULL');

        // Filtreleri uygula
        if (filters.text) {
            queryBuilder.andWhere(
                '(transaction.referenceNumber LIKE :text OR transaction.details LIKE :text OR transaction.note LIKE :text)',
                { text: `%${filters.text}%` }
            );
        }

        if (filters.typeId) {
            queryBuilder.andWhere('type.id = :typeId', { typeId: filters.typeId });
        }

        if (filters.statusId) {
            queryBuilder.andWhere('status.id = :statusId', { statusId: filters.statusId });
        }

        if (filters.accountId) {
            queryBuilder.andWhere('account.id = :accountId', { accountId: filters.accountId });
        }

        if (filters.assignedUserId) {
            queryBuilder.andWhere('user.id = :assignedUserId', { assignedUserId: filters.assignedUserId });
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

        if (filters.closedDateStart) {
            queryBuilder.andWhere('transaction.closedDate >= :closedDateStart', {
                closedDateStart: new Date(filters.closedDateStart),
            });
        }

        if (filters.closedDateEnd) {
            queryBuilder.andWhere('transaction.closedDate <= :closedDateEnd', {
                closedDateEnd: new Date(filters.closedDateEnd),
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
}
