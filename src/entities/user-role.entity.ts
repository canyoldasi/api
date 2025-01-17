import { User } from "src/entities/user.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";
import { Field, ObjectType } from "@nestjs/graphql";

@Entity()
@ObjectType()
export class UserRole {
    @PrimaryGeneratedColumn()
    @Field()
    id: number;

    @ManyToOne(() => User, (x) => x.roles)
    @Field(() => User)
    user: User;

    @ManyToOne(() => Role, (x) => x.users)
    @Field(() => Role)
    role: Role;
}