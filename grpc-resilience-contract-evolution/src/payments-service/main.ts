import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PAYMENTS_PACKAGE_NAME } from '../common/grpc.constants';
import { PaymentsModule } from './payments.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);

  const configService = new ConfigService();
  const url = configService.get<string>('PAYMENTS_GRPC_BIND_URL', '0.0.0.0:5022');

  const grpc = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: PAYMENTS_PACKAGE_NAME,
      protoPath: join(process.cwd(), 'proto/payments.proto'),
      url
    }
  });

  await grpc.listen();
  await app.init();
  console.log(`payments-service gRPC started on ${url}`);
}

bootstrap();
