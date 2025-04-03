import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Language {
    @Field(() => String)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => String)
    @Column({ length: 2, unique: true })
    code: string;

    @Field(() => String)
    @Column({ length: 50 })
    name: string;

    @Field(() => String)
    @Column({ length: 50 })
    nativeName: string;

    @Field(() => Boolean)
    @Column({ default: true })
    isActive: boolean;

    @Field(() => Boolean)
    @Column({ default: false })
    isDefault: boolean;

    @Field(() => String)
    @Column({ length: 3, default: 'ltr' })
    direction: string;
}
