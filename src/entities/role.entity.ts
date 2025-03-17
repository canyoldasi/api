import { Column, Entity, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { RolePermission } from './role-permission.entity';
import { Permission } from '../constants';
import { PermissionEnum } from '../types/permission.enum';

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

    @Field(() => [PermissionEnum], { nullable: true })
    get permissions(): Permission[] {
        return this.rolePermissions?.map((rp) => rp.permission) || [];
    }

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
