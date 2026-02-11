import type { FastifyServerOptions } from 'fastify';

type Environment = 'development' | 'production' | 'test';

const envToLogger: Record<Environment, FastifyServerOptions['logger']> = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
};

export function getLoggerConfig(): FastifyServerOptions['logger'] {
  const environment = (process.env.NODE_ENV || 'development') as Environment;
  return envToLogger[environment] ?? true;
}
