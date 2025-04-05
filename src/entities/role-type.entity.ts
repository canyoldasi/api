import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';

@Entity()
@ObjectType()
export class RoleType {
    @PrimaryGeneratedColumn('uuid')
    @Field()
    id: string;

    @Column({ unique: true, nullable: true })
    @Field({ nullable: true })
    code: string;

    @Column()
    @Field()
    name: string;

    @Column({ default: true })
    @Field({ defaultValue: true })
    isActive: boolean;
}
