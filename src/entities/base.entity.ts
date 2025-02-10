import { Field, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, DeleteDateColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@ObjectType()
export abstract class BaseEntity{
    @PrimaryGeneratedColumn('uuid')
    @Field({nullable: false})
    id: string;

    @CreateDateColumn({ type: 'timestamp', nullable: false })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public createdBy: User;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public updatedBy: User;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public deletedBy: User;
}