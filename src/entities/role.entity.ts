import { Column, Entity, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { RolePermission } from './role-permission.entity';
import { RoleType } from './role-type.entity';

@Entity()
@ObjectType()
export class Role extends BaseEntity {
    @Column({ nullable: false })
    @Field()
    name: string;

    @ManyToOne(() => RoleType, { nullable: true })
    @Field(() => RoleType, { nullable: true })
    roleType?: RoleType;

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

    @Column({ nullable: true })
    @Field({ nullable: true })
    homepage?: string;
}
