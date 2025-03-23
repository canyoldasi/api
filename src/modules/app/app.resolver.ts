import { Query, Resolver } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AppInfo {
    @Field(() => String)
    name: string;

    @Field(() => String)
    logo: string;
}

@Resolver()
export class AppResolver {
    constructor(private configService: ConfigService) {}

    @Query(() => String)
    getHello(): string {
        return 'Merhaba!';
    }

    @Query(() => AppInfo)
    getApp(): AppInfo {
        return {
            name: process.env.APP_NAME || 'Kurum Adı',
            logo: process.env.APP_LOGO || '',
        };
    }
}
