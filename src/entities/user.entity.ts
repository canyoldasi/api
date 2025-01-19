import { UserRole } from 'src/entities/user-role.entity';
import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm'
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';

@Entity()
@ObjectType()
export class User extends BaseEntity{
    @Column()
    @Field({nullable: false})
    username: string;

    @Column()
    @Field({nullable: false})
    password: string;

    @Column()
    @Field({nullable: true})
    fullName: string;
  
    @Column({ default: true })
    @Field({nullable: true, defaultValue: true})
    isActive: boolean;

    @OneToMany(() => UserRole, (x) => x.user)
    @Field(type => [UserRole], {nullable: true})
    roles?: UserRole[];
}