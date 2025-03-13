import { FastifyRequest } from 'fastify';

export default interface FastifyRequestCustom extends FastifyRequest {
    requestId?: string;
    user?: {
        user: any;
        roles: any[];
        permissions: string[];
    };
}
