import { isHttpError } from '@/domain';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: Error, _: FastifyRequest, reply: FastifyReply) => {
    if (isHttpError(error)) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    fastify.log.error(error);

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
}
