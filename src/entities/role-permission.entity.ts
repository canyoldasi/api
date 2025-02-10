import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { ObjectType, Field, Int } from "@nestjs/graphql";
import { BaseEntity } from "./base.entity";
import { Permission } from "src/constants";

@Entity()
@ObjectType()
export class RolePermission extends BaseEntity {
    @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: "CASCADE" })
    @Field(() => Role)
    role: Role;

    @Column({ nullable: false })
    @Field()
    permission: Permission;
}
