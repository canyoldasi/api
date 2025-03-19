import { Field, ObjectType } from '@nestjs/graphql';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from './account.entity';
import { Segment } from './segment.entity';

@ObjectType()
@Entity()
export class AccountSegment {
    @PrimaryGeneratedColumn('uuid')
    @Field()
    id: string;

    @ManyToOne(() => Account, (account) => account.segments, {
        onDelete: 'CASCADE',
    })
    @Field(() => Account)
    account: Account;

    @ManyToOne(() => Segment, (segment) => segment.accountSegments, {
        onDelete: 'CASCADE',
    })
    @Field(() => Segment)
    segment: Segment;
}
