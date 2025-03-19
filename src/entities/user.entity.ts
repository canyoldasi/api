import { Entity, Column, ManyToOne } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

@Entity()
@ObjectType()
export class User extends BaseEntity {
    @Column({ unique: true })
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

    @ManyToOne(() => Role, (role) => role.users, { nullable: false })
    @Field(() => Role)
    role: Role;
}
