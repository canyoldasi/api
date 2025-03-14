import { Column, Entity, ManyToOne } from 'typeorm';
import { Role } from './role.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Permission } from '../constants';

@Entity()
@ObjectType()
export class RolePermission extends BaseEntity {
    @ManyToOne(() => Role, (role) => role.rolePermissions)
    @Field(() => Role)
    role: Role;

    @Column()
    @Field()
    permission: Permission;
}
