import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Enable CORS for frontend integration with specific origins
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-role',
      'x-user-id',
    ],
  });

  // Global validation pipe with whitelist and transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Event Management System API')
    .setDescription(
      'Complete REST API for Event Management & Coordination with RBAC\n\n' +
      '**Authentication:**\n\n' +
      'Authenticated endpoints require `Authorization: Bearer <JWT>`.\n\n' +
      '**Demo Users:**\n\n' +
      '- SuperAdmin: superadmin@example.com / Admin@123\n' +
      '- Client: client@example.com / Client@123\n' +
      '- Organizer: organizer@example.com / Organizer@123\n' +
      '- Staff: staff@example.com / Staff@123\n' +
      '- Attendee: attendee@example.com / Attendee@123',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Save Swagger JSON to docs/swagger.json
  const docsPath = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsPath)) {
    fs.mkdirSync(docsPath, { recursive: true });
  }
  fs.writeFileSync(
    path.join(docsPath, 'swagger.json'),
    JSON.stringify(document, null, 2),
  );

  SwaggerModule.setup('docs', app, document);

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api`);
  console.log(`📄 Swagger JSON exported to: docs/swagger.json`);
}

bootstrap();
