import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from './transaction.entity';

@Entity('currencies')
export class Currency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50 })
    name: string;

    @Column({ length: 3 })
    code: string;

    @Column({ length: 5 })
    symbol: string;

    @OneToMany(() => Transaction, (transaction) => transaction.currency)
    transactions: Transaction[];
} 