import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Agro-Trade API")
    .setDescription("API documentation for Agro-Trade platform")
    .setVersion(process.env.npm_package_version || "1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs/openapi.json",
  });
}

export function createSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Agro-Trade API")
    .setDescription("API documentation for Agro-Trade platform")
    .setVersion(process.env.npm_package_version || "1.0.0")
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}
