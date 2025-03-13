import { FastifyRequest } from 'fastify';

interface FastifyRequestCustom extends FastifyRequest {
    requestId: string;
    user?: {
        user: any;
        roles: any[];
        permissions: string[];
    };
}

export default FastifyRequestCustom;
