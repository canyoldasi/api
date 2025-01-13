import { Role } from 'src/providers/role.enum';
import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm'

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

    @Column()
    roles: string;
}