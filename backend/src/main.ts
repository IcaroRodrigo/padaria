import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('[ENV CHECK]', {
    JWT_SECRET: process.env.JWT_SECRET ? '[SET]' : '[MISSING]',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '[SET]' : '[MISSING]',
    DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[MISSING]',
    FRONTEND_URL: process.env.FRONTEND_URL ? '[SET]' : '[MISSING]',
  });

  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Casa Granella API rodando em http://0.0.0.0:${port}/api`);
}
bootstrap();
