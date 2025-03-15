import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../providers/jwt.strategy';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from '../user/user.module';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from 'src/providers/logger.config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/providers/global.exception-filter';
import { RequestMiddleware } from 'src/providers/request.middleware';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/user-role.entity';
import { RolePermission } from 'src/entities/role-permission.entity';
import { RoleModule } from '../role/role.module';
import { AuthGuard } from '../../providers/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { Log } from 'src/entities/log.entity';
import { LogModule } from '../log/log.module';
import { LoggingInterceptor } from 'src/providers/logging.interceptor';
import { Account } from 'src/entities/account.entity';
import { Contact } from 'src/entities/contact.entity';
import { OpportunityStatus } from 'src/entities/opportunity-status.entity';
import { Opportunity } from 'src/entities/opportunity.entity';
import { Product } from 'src/entities/product.entity';
import { AccountType } from 'src/entities/account-type.entity';
import { AccountArea } from 'src/entities/account-area.entity';
import { City } from 'src/entities/city.entity';
import { County } from 'src/entities/county.entity';

@Module({
    imports: [
        WinstonModule.forRoot(loggerConfig),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT),
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            synchronize: Boolean(process.env.DATABASE_SYNC),
            autoLoadEntities: false,
            entities: [
                User,
                Role,
                UserRole,
                RolePermission,
                Log,
                Account,
                Contact,
                Opportunity,
                OpportunityStatus,
                Product,
                AccountType,
                City,
                County,
                AccountArea,
            ],
            //namingStrategy: new SnakeNamingStrategy()
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: true,
            sortSchema: true,
            playground: process.env.NODE_ENV === 'development',
            introspection: true,
            context: (context) => {
                return {
                    req: context,
                    user: context?.raw?.user,
                };
            },
        }),
        UserModule,
        AuthModule,
        RoleModule,
        LogModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestMiddleware).forRoutes('*');
    }
}
