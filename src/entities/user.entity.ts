import { UserRole } from '../entities/user-role.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';

@Entity()
@ObjectType()
export class User extends BaseEntity {
    @Column()
    @Field({ nullable: false })
    username: string;

    @Column()
    @Field({ nullable: false })
    password: string;

    @Column()
    @Field({ nullable: false })
    fullName: string;

    @Column({ default: true })
    @Field({ nullable: true, defaultValue: true })
    isActive: boolean;

    @OneToMany(() => UserRole, (x) => x.user)
    @Field(() => [UserRole], { nullable: true })
    roles?: UserRole[];
}
