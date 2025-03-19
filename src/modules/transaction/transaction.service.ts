import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionType } from '../../constants';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>
    ) {}

    async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        // İşlem tipine göre account kontrolü
        if (createTransactionDto.type === TransactionType.RESERVATION && !createTransactionDto.accountId) {
            throw new BadRequestException('Taşımacılık/Rezervasyon işlemlerinde account zorunludur.');
        }

        const transaction = this.transactionRepository.create(createTransactionDto);
        return this.transactionRepository.save(transaction);
    }

    async update(id: string, updateTransactionDto: CreateTransactionDto): Promise<Transaction> {
        const transaction = await this.transactionRepository.findOne({
            where: { id },
        });

        if (!transaction) {
            throw new BadRequestException('İşlem bulunamadı');
        }

        // İşlem tipine göre account kontrolü
        if (
            (transaction.type === TransactionType.RESERVATION ||
                updateTransactionDto.type === TransactionType.RESERVATION) &&
            updateTransactionDto.accountId === null
        ) {
            throw new BadRequestException('Taşımacılık/Rezervasyon işlemlerinde account zorunludur.');
        }

        Object.assign(transaction, updateTransactionDto);
        return this.transactionRepository.save(transaction);
    }

    // Diğer servis metodları...
}
