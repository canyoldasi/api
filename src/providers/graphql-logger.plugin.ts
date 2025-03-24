import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLRequestContext } from '@apollo/server';
import { Injectable } from '@nestjs/common';
import { LogService } from '../modules/log/log.service';
import { LOG_LEVEL } from '../constants';

interface GraphQLResponse {
    errors?: any[];
    data?: any;
}

@Injectable()
export class GraphQLLoggerPlugin implements ApolloServerPlugin {
    constructor(private readonly logService: LogService) {}

    async requestDidStart(requestContext: GraphQLRequestContext<any>): Promise<void> {
        const { request } = requestContext;
        const operation = request.operationName || 'Anonymous Operation';
        const query = request.query;
        const variables = request.variables;
        const requestId = requestContext.contextValue?.req?.raw?.requestId;

        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: 'GraphQL',
            action: request.operationName ? 'Operation' : 'Query',
            message: `GraphQL ${request.operationName ? 'Operation' : 'Query'}: ${operation}`,
            details: {
                query,
                variables,
            },
            requestId,
        });
    }

    async willSendResponse(requestContext: GraphQLRequestContext<any>): Promise<void> {
        const response = requestContext.response as unknown as GraphQLResponse;
        const operation = requestContext.request.operationName || 'Anonymous Operation';
        const requestId = requestContext.contextValue?.req?.raw?.requestId;

        if (response.errors) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: 'GraphQL',
                action: 'Error',
                message: `GraphQL Error in ${operation}`,
                details: {
                    operation,
                    errors: response.errors,
                },
                requestId,
            });
        }
    }
}
