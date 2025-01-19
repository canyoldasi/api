import { User } from "src/entities/user.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { Field, ObjectType } from "@nestjs/graphql";
import { BaseEntity } from "./base.entity";

@Entity()
@ObjectType()
export class UserRole extends BaseEntity{
    @ManyToOne(() => User, (x) => x.roles, {onDelete: 'CASCADE'})
    @Field(() => User)
    user: User;

    @ManyToOne(() => Role, (x) => x.users, {onDelete: 'CASCADE'})
    @Field(() => Role)
    role: Role;
}