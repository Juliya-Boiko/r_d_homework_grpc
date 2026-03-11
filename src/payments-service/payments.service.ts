import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthorizeInput, PaymentStatusType } from './payments.types';

type PaymentState = {
  paymentId: string;
  orderId: string;
  status: PaymentStatusType;
};

type PaymentData = {
  paymentId: string;
  status: string;
  message: string
}

@Injectable()
export class PaymentsService {
  private readonly paymentsById = new Map<string, PaymentState>();
  private readonly idempotencyMap = new Map<string, PaymentData>();

  authorize(input: AuthorizeInput): PaymentData {
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
