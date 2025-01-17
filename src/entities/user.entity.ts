import { UserRole } from 'src/entities/user-role.entity';
import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm'

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    fullName: string;
  
    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => UserRole, (x) => x.user)
    roles: UserRole[];
}