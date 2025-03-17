import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

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

    @Column({ name: 'roleId' })
    roleId: string;

    @ManyToOne(() => Role, (role) => role.users, { nullable: false })
    @JoinColumn({ name: 'roleId' })
    @Field(() => Role)
    role: Role;
}
