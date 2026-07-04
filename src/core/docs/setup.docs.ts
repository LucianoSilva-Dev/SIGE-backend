import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import type { EnvConfig } from '../../config';
import { auth } from '../auth/auth';
import { shouldEnableDocs } from '../security/security.config';
import { GlobalApiModels } from './docs.registry';
import { buildApiServers } from './helpers/build-api-servers';

export async function setupDocs(app: INestApplication, appPort: number) {
  const configService = app.get<ConfigService<EnvConfig>>(ConfigService);
  const environment = configService.get<string>('ENVIRONMENT');
  const docsEnabled = shouldEnableDocs({
    environment,
    docsEnabled: configService.get<boolean | undefined>('DOCS_ENABLED'),
  });

  if (!docsEnabled) {
    return false;
  }

  const productionUrl = configService.get<string>('API_URL');

  const apiServers = buildApiServers({
    port: appPort,
    productionUrl,
  });

  const docsConfig = new DocumentBuilder()
    .setTitle('SIGE Backend API')
    .setDescription('Backend API for SIGE platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer(apiServers.localServer.url, apiServers.localServer.description)
    .addServer(apiServers.productionServer.url, apiServers.productionServer.description)
    .build();

  const swaggerAppDocument = SwaggerModule.createDocument(app, docsConfig, {
    extraModels: GlobalApiModels,
  });

  const swaggerAuthDocument = await auth.api.generateOpenAPISchema();

  swaggerAuthDocument.servers = [
    { url: `${apiServers.localServer.url}/auth` },
    { url: `${apiServers.productionServer.url}/auth` },
  ];

  app.use(
    '/docs',
    apiReference({
      sources: [
        {
          content: cleanupOpenApiDoc(swaggerAppDocument),
          title: 'SIGE Backend API',
          slug: 'sige-backend-api',
        },
        {
          content: swaggerAuthDocument,
          title: 'SIGE Auth API',
          slug: 'sige-auth-api',
        },
      ],
      theme: 'elysiajs',
      configuration: {
        metaData: {
          title: 'SIGE API Documentation',
        },
      },
    }),
  );

  return true;
}
