import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PAYMENTS_PACKAGE_NAME } from '../common/grpc.constants';
import { OrdersController } from './orders.controller';
import { PaymentsGrpcClient } from './payments-grpc.client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENTS_GRPC_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: PAYMENTS_PACKAGE_NAME,
            protoPath: join(process.cwd(), 'proto/payments.proto'),
            url: configService.get<string>('PAYMENTS_GRPC_URL', 'localhost:5022')
          }
        })
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [PaymentsGrpcClient]
})
export class AppModule {}
