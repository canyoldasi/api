import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { Permission } from '../constants';

@Entity()
@ObjectType()
export class RolePermission extends BaseEntity {
    @Column({ name: 'roleId' })
    roleId: string;

    @ManyToOne(() => Role, (role) => role.rolePermissions, { nullable: false })
    @JoinColumn({ name: 'roleId' })
    @Field(() => Role)
    role: Role;

    @Column({ type: 'varchar' })
    @Field()
    permission: Permission;
}
