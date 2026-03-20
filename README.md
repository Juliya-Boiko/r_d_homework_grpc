# Payments gRPC Homework


## Локальний запуск двох сервісів

```bash
cp .env.example .env
pnpm install
pnpm start:payments:dev
# в іншому терміналі
pnpm start:orders:dev
```

- Port: 3021 (HTTP)
- Port: 5021 (gRPC)

## Happy Path перевірка через Postman
**Authorize payment**
POST http://localhost:3021/orders/11111111-1111-1111-1111-111111111111/pay
 + Body (JSON)
  {
    "userId": "22222222-2222-2222-2222-222222222222",
    "amount": "99.90",
    "currency": "USD",
    "idempotencyKey": "test-key-001"
  }

RESULT: 
  {
    "paymentId": "48e553d4-dc9b-46e8-8a6e-b5a4a45b6733",
    "status": 1,
    "message": "Payment authorized"
  }

**Check payment status**
GET http://localhost:3021/orders/payments/48e553d4-dc9b-46e8-8a6e-b5a4a45b6733/status

RESULT: 
  {
      "paymentId": "48e553d4-dc9b-46e8-8a6e-b5a4a45b6733",
      "status": 1,
      "orderId": "11111111-1111-1111-1111-111111111111"
  }

## .proto контракт
**Розташування**
/proto/payments.proto

**Підключення у сервісах**
- Payments-service: використовується у PaymentsGrpcController та PaymentsModule
- Orders-service: використовується у PaymentsGrpcClient через NestJS ClientGrpc

# CI/CD Pipeline for Orders Service

## Git Flow
- `feature/*` → робочі гілки
- `develop` → stage deploy
- `main` → production deploy

## Workflows
1. **PR Checks** (`.github/workflows/pr-checks.yml`)
   - lint
   - unit tests
   - Docker build validation

2. **Build & Stage Deploy** (`.github/workflows/build-and-stage.yml`)
   - build Docker image
   - create release manifest
   - deploy to local stage container
   - health check

3. **Deploy Production** (`.github/workflows/deploy-prod.yml`)
   - manual trigger
   - deploy same image to local production container
   - health check

## Testing locally
- Stage: http://localhost:3021
- Prod: http://localhost:4021

<!-- test -->test PR
