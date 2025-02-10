import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from "./base.entity";
import { RolePermission } from "./role-permission.entity";

@Entity()
@ObjectType()
export class Role extends BaseEntity{
    @Column({nullable: false})
    @Field()
    name: string;

    @OneToMany(() => User, (x) => x.roles)
    users?: User[]

    @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
    rolePermissions?: RolePermission[];
}