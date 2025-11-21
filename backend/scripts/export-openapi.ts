import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { createSwaggerDocument } from '../src/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { stringify as toYaml } from 'yaml';

async function exportOpenApi() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });

  const document = createSwaggerDocument(app);
  const outputDir = join(__dirname, '..', 'openapi');
  mkdirSync(outputDir, { recursive: true });

  const jsonPath = join(outputDir, 'agro-trade.json');
  const yamlPath = join(outputDir, 'agro-trade.yaml');

  writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf8');
  writeFileSync(yamlPath, toYaml(document), 'utf8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI document exported to ${jsonPath} and ${yamlPath}`);
}

exportOpenApi().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to export OpenAPI document', error);
  process.exit(1);
});
