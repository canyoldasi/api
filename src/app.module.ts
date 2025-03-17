import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

// Entities
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Account } from './entities/account.entity';
import { Contact } from './entities/contact.entity';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunityStatus } from './entities/opportunity-status.entity';
import { Product } from './entities/product.entity';
import { Log } from './entities/log.entity';
import { AccountType } from './entities/account-type.entity';
import { City } from './entities/city.entity';
import { County } from './entities/county.entity';
import { AccountLocation } from './entities/account-location.entity';

// Modules
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { LogModule } from './modules/log/log.module';
import { LocationModule } from './modules/location/location.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST'),
                port: +configService.get('DB_PORT'),
                username: configService.get('DB_USERNAME'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_DATABASE'),
                entities: [
                    User,
                    Role,
                    RolePermission,
                    Account,
                    Contact,
                    Opportunity,
                    OpportunityStatus,
                    Product,
                    Log,
                    AccountType,
                    City,
                    County,
                    AccountLocation,
                ],
                synchronize: configService.get('NODE_ENV') !== 'production',
                logging: configService.get('NODE_ENV') !== 'production',
            }),
            inject: [ConfigService],
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
        }),
        UserModule,
        RoleModule,
        LogModule,
        LocationModule,
    ],
})
export class AppModule {}
