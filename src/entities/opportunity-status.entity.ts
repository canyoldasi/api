import { Entity, Column } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';

@Entity()
@ObjectType()
export class OpportunityStatus extends BaseEntity {
    @Column()
    @Field()
    name: string;

    @Column({ type: 'int' })
    @Field()
    sortOrder: number;

    @Column({ default: true })
    @Field()
    isActive: boolean;

    @Column({ default: false })
    @Field()
    isSuccess: boolean;
}
