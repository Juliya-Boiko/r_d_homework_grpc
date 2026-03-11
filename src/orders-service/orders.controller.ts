import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthorizeOrderDto } from './dto/authorize-order.dto';
import {
  AuthorizeResponse,
  GetPaymentStatusResponse,
  PaymentsGrpcClient
} from './payments-grpc.client';

@Controller('orders')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class OrdersController {
  constructor(private readonly paymentsGrpcClient: PaymentsGrpcClient) {}

  @Get('health')
  health() {
    return { ok: true, service: 'orders' };
  }

  @Post(':orderId/pay')
  async payOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: AuthorizeOrderDto
  ): Promise<AuthorizeResponse> {
    return this.paymentsGrpcClient.authorize({
      orderId,
      userId: dto.userId,
      total: {
        amount: dto.amount,
        currency: dto.currency
      },
      idempotencyKey: dto.idempotencyKey ?? randomUUID()
    });
  }

  @Get('payments/:paymentId/status')
  async paymentStatus(
    @Param('paymentId', ParseUUIDPipe) paymentId: string
  ): Promise<GetPaymentStatusResponse> {
    return this.paymentsGrpcClient.getStatus(paymentId);
  }
}
