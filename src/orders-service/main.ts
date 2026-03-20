import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configService = app.get(ConfigService);
  // const port = configService.get<number>('ORDERS_PORT', 3021);

  // await app.listen(port);
  // console.log(`orders-service started on http://localhost:${port}`);
  const port = configService.get<number>('ORDERS_PORT', 3021);
  await app.listen(port, '0.0.0.0');
  console.log(`orders-service started on http://0.0.0.0:${port}`);
}

bootstrap();
