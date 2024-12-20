import { IsInt, IsOptional, IsString } from "class-validator";

export class CatCreateDto{
    name: string;

    @IsInt()
    @IsOptional()
    age: number;
}
