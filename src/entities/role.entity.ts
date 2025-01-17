import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Role {
    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    code: string;

    @OneToMany(() => User, (x) => x.roles)
    users?: User[]
}