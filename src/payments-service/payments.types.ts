export type AuthorizeInput = {
  orderId: string;
  idempotencyKey?: string;
}

export type PaymentStatusType = 'PAYMENT_STATUS_AUTHORIZED' | 'PAYMENT_STATUS_CAPTURED' | 'PAYMENT_STATUS_REFUNDED' | 'PAYMENT_STATUS_FAILED';
