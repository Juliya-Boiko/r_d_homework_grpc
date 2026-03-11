import { PaymentsService } from '../src/payments-service/payments.service';

describe('PaymentsService (extraction)', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
  });

  it('authorizes and returns retrievable status', () => {
    const result = service.authorize({ orderId: 'order-1' });

    expect(result.paymentId).toBeDefined();
    expect(result.status).toBe('PAYMENT_STATUS_AUTHORIZED');

    const status = service.getStatus(result.paymentId);
    expect(status).not.toBeNull();
    expect(status?.orderId).toBe('order-1');
  });

  it('is idempotent by idempotencyKey', () => {
    const first = service.authorize({
      orderId: 'order-2',
      idempotencyKey: 'idem-1'
    });

    const second = service.authorize({
      orderId: 'order-2',
      idempotencyKey: 'idem-1'
    });

    expect(second.paymentId).toBe(first.paymentId);
  });

  it('returns null for unknown payment status', () => {
    const status = service.getStatus('missing-payment-id');
    expect(status).toBeNull();
  });
});
