import { Column, Entity, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { RolePermission } from './role-permission.entity';

@Entity()
@ObjectType()
export class Role extends BaseEntity {
    @Column({ nullable: false })
    @Field()
    name: string;

    @OneToMany(() => User, (user) => user.role)
    @Field(() => [User], { nullable: true })
    users?: User[];

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
    @Field(() => [RolePermission], { nullable: true })
    rolePermissions?: RolePermission[];

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
