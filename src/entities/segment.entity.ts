import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AccountSegment } from './account-segment.entity';

@ObjectType()
@Entity()
export class Segment extends BaseEntity {
    @Column()
    @Field()
    name: string;

    @Column({ default: true })
    @Field({ nullable: true, defaultValue: true })
    isActive: boolean;

    @Column({ nullable: true })
    @Field({ nullable: true })
    note?: string;

    @OneToMany(() => AccountSegment, (accountSegment) => accountSegment.segment)
    @Field(() => [AccountSegment], { nullable: true })
    accountSegments?: AccountSegment[];
}
