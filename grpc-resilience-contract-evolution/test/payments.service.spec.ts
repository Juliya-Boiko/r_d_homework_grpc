import { PaymentsService } from '../src/payments-service/payments.service';

describe('PaymentsService (resilience)', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
  });

  it('is idempotent by idempotency key', () => {
    const first = service.authorize({
      orderId: 'order-1',
      amount: '10.00',
      idempotencyKey: 'idem-1'
    });

    const second = service.authorize({
      orderId: 'order-1',
      amount: '10.00',
      idempotencyKey: 'idem-1'
    });

    expect(second.paymentId).toBe(first.paymentId);
  });

  it('fails transient only once for same order when enabled', () => {
    const first = service.shouldFailTransient('order-2', true);
    const second = service.shouldFailTransient('order-2', true);

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('stores providerRef and returns status', () => {
    const result = service.authorize({
      orderId: 'order-3',
      amount: '12.50',
      paymentMethod: 'apple-pay'
    });

    expect(result.providerRef).toContain('apple-pay');

    const status = service.getStatus(result.paymentId);
    expect(status).not.toBeNull();
    expect(status?.providerRef).toBe(result.providerRef);
  });
});
