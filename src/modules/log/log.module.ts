import { Module, Global, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from '../../entities/log.entity';
import { LogService } from './log.service';
import { GraphQLLoggerPlugin } from '../../providers/graphql-logger.plugin';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    providers: [LogService, GraphQLLoggerPlugin],
    exports: [LogService, GraphQLLoggerPlugin],
})
export class LogModule {
    static forRoot(): DynamicModule {
        return {
            module: LogModule,
            imports: [TypeOrmModule.forFeature([Log])],
            global: true,
            providers: [LogService, GraphQLLoggerPlugin],
            exports: [LogService, GraphQLLoggerPlugin],
        };
    }
}
