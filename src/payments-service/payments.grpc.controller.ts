import { Controller, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { GrpcMethod } from '@nestjs/microservices';
import { PAYMENTS_SERVICE_NAME } from '../common/grpc.constants';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsGrpcController {
  private readonly logger = new Logger(PaymentsGrpcController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @GrpcMethod(PAYMENTS_SERVICE_NAME, 'Authorize')
  authorize(payload: { orderId: string; idempotencyKey?: string }) {
    if (!payload.orderId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'order_id is required'
      });
    }

    const result = this.paymentsService.authorize(payload);
    this.logger.log(
      `authorize orderId=${payload.orderId} paymentId=${result.paymentId}`
    );
    return result;
  }

  @GrpcMethod(PAYMENTS_SERVICE_NAME, 'GetPaymentStatus')
  getPaymentStatus(payload: { paymentId: string }) {
    const payment = this.paymentsService.getStatus(payload.paymentId);

    if (!payment) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'payment not found'
      });
    }

    this.logger.log(`status paymentId=${payload.paymentId}`);
    return payment;
  }

  @GrpcMethod(PAYMENTS_SERVICE_NAME, 'Capture')
  capture() {
    return {
      ok: true,
      message: 'Capture stub'
    };
  }

  @GrpcMethod(PAYMENTS_SERVICE_NAME, 'Refund')
  refund() {
    return {
      ok: true,
      message: 'Refund stub'
    };
  }
}
