import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToMany } from 'typeorm';
import { Account } from './account.entity';
import { BaseEntity } from './base.entity';

@ObjectType()
@Entity()
export class Segment extends BaseEntity {
    @Field()
    @Column()
    name: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    note?: string;

    @Field(() => [Account], { nullable: true })
    @ManyToMany(() => Account, (account) => account.segments)
    accounts?: Account[];
}
