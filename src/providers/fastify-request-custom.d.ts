import { FastifyRequest } from 'fastify';

interface FastifyRequestCustom extends FastifyRequest {
    requestId: string;
}

export default FastifyRequestCustom;
