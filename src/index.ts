import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import 'dotenv/config';
import { connectToDatabase } from '@/infrastructure/database/mongodb/mongo-connection';
import { errorHandlerPlugin } from '@/presentation/http/plugins/error-handler.plugin';
import { makeRepositories, makeServices, makeUseCases } from '@/factories';
import { registerRoutes } from './presentation/http/routes';

async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>();

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
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export { buildApp };
