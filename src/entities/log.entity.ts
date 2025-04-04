import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { LogLevel } from 'src/types/constants';

@Entity()
@ObjectType()
export class Log {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    createdAt: Date;

    @Column({ nullable: false })
    @Field()
    level: LogLevel;

    @Column({ nullable: true })
    @Field({ nullable: true })
    module?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    action?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    message?: string;

    @Column({ nullable: true })
    @Field(() => String, { nullable: true })
    details?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    stackTrace?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    customerId?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    userId?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    userAgent?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    requestId?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    entity?: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    entityType?: string;
}
