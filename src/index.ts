import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import 'dotenv/config';
import { makeRepositories, makeServices, makeUseCases } from '@/factories';
import { registerRoutes } from './presentation/http/routes';
import { getLoggerConfig } from './config';
import { errorHandlerPlugin } from './presentation/http/plugins';
import { connectToDatabase, disconnectFromDatabase } from './infrastructure';

async function buildApp() {
  const app = Fastify({
    logger: getLoggerConfig(),
  }).withTypeProvider<ZodTypeProvider>();

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  app.log.info('Connecting to MongoDB...');
  const db = await connectToDatabase();
  app.log.info('Connected to MongoDB');

  const repositories = makeRepositories(db);
  app.log.info('Repositories created');
  const services = makeServices(repositories);
  app.log.info('Services created');
  const useCases = makeUseCases(repositories, services);
  app.log.info('Use cases created');

  await Promise.all([
    repositories.loanRepository.ensureIndexes(),
    repositories.concentrationLimitRepository.ensureIndexes(),
  ]);
  app.log.info('Indexes ensured');

  await app.register(errorHandlerPlugin);
  app.log.info('Error handler registered');
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Condolivre Challenge API',
        description: 'API para controle de risco de concentração de empréstimos',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);

  await registerRoutes(app, useCases);

  return app;
}

const bootstrap = async () => {
  const app = await buildApp();

  const PORT = parseInt(process.env.PORT || '3333', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, closing gracefully...`);
    try {
      await app.close();
      await disconnectFromDatabase();
      app.log.info('Application closed successfully');
      process.exit(0);
    } catch (err) {
      app.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export { buildApp };
