import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Permission } from '../constants';

@Entity()
@ObjectType()
export class RolePermission {
    @PrimaryGeneratedColumn('uuid')
    @Field({ nullable: false })
    id: string;

    @ManyToOne(() => Role, (role) => role.rolePermissions, { nullable: false })
    @Field(() => Role)
    role: Role;

    @Column({ type: 'varchar' })
    @Field()
    permission: Permission;
}
