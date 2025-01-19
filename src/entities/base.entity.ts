import { Field, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, DeleteDateColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";

@ObjectType()
export abstract class BaseEntity{
    @PrimaryGeneratedColumn('uuid')
    @Field({nullable: false})
    id: string;

    @CreateDateColumn({ type: 'datetime', nullable: false })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public createdBy: User;

    @UpdateDateColumn({ type: 'datetime', nullable: true })
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public updatedBy: User;

    @DeleteDateColumn({ type: 'datetime', nullable: true })
    deletedAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    public deletedBy: User;
}