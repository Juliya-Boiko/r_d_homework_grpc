import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

type PaymentState = {
  paymentId: string;
  orderId: string;
  status: 'PAYMENT_STATUS_AUTHORIZED' | 'PAYMENT_STATUS_CAPTURED' | 'PAYMENT_STATUS_REFUNDED' | 'PAYMENT_STATUS_FAILED';
};

@Injectable()
export class PaymentsService {
  private readonly paymentsById = new Map<string, PaymentState>();
  private readonly idempotencyMap = new Map<string, { paymentId: string; status: string; message: string }>();

  authorize(input: {
    orderId: string;
    idempotencyKey?: string;
  }): { paymentId: string; status: string; message: string } {
    if (input.idempotencyKey && this.idempotencyMap.has(input.idempotencyKey)) {
      return this.idempotencyMap.get(input.idempotencyKey)!;
    }

    const paymentId = randomUUID();
    const payment: PaymentState = {
      paymentId,
      orderId: input.orderId,
      status: 'PAYMENT_STATUS_AUTHORIZED'
    };

    this.paymentsById.set(paymentId, payment);

    const response = {
      paymentId,
      status: payment.status,
      message: 'Payment authorized'
    };

    if (input.idempotencyKey) {
      this.idempotencyMap.set(input.idempotencyKey, response);
    }

    return response;
  }

  getStatus(paymentId: string): PaymentState | null {
    return this.paymentsById.get(paymentId) ?? null;
  }
}
