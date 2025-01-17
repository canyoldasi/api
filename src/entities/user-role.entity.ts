import { User } from "src/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity()
export class UserRole {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (x) => x.roles)
    user: User;

    @ManyToOne(() => Role, (x) => x.users)
    role: Role;
}