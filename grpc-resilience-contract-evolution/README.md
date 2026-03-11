# gRPC Resilience + Contract Evolution

Навчальний проєкт для лекції 14: timeout/retry/idempotency для Orders -> Payments gRPC, плюс еволюція контракту `v1 -> v2` без breaking changes.

## Що реалізовано

- timeout/deadline на кожен RPC виклик (`PAYMENTS_RPC_TIMEOUT_MS`)
- retry policy тільки для transient помилок (`UNAVAILABLE`, `DEADLINE_EXCEEDED`)
- exponential backoff (`PAYMENTS_RPC_BACKOFF_MS`)
- idempotency для `Authorize` (по `idempotencyKey`)
- error mapping gRPC status -> HTTP помилки
- backward-compatible schema evolution:
  - додані поля `payment_method`, `provider_ref`, `schema_version`, `failure_reason`

## Структура

- `proto/payments.proto` — контракт з additive v2 полями
- `src/orders-service/*` — адаптер з timeout/retry/error mapping
- `src/payments-service/*` — gRPC server з transient-failure симуляцією

## Локальний запуск

```bash
cp .env.example .env
pnpm install
pnpm start:payments:dev
# в іншому терміналі
pnpm start:orders:dev
```

- Orders API: `http://localhost:3022`
- Payments gRPC: `localhost:5022`

## Тести

```bash
pnpm test
```

Покриває `PaymentsService`: idempotency, transient-failure gate, providerRef/status.

## Автоматичний E2E smoke

```bash
pnpm e2e:smoke
```

Скрипт:
- піднімає обидва сервіси на тимчасових портах (`3122`, `5122`);
- чекає readiness через `GET /orders/health`;
- проганяє happy-path;
- проганяє transient failure + retry;
- перевіряє idempotency;
- перевіряє 400 на невалідному amount;
- друкує live-логи з обох сервісів.

## Запуск через Docker Compose

```bash
docker compose up --build
```

## Postman

Колекція для ручної перевірки:

- `../postman/lesson14-grpc-resilience-contract-evolution.postman_collection.json`

## Демо сценарії

### 1) Happy-path

```bash
curl -X POST 'http://localhost:3022/orders/11111111-1111-1111-1111-111111111111/pay' \
  -H 'content-type: application/json' \
  -d '{
    "userId": "22222222-2222-2222-2222-222222222222",
    "amount": "149.50",
    "currency": "USD",
    "idempotencyKey": "resilience-demo-1",
    "paymentMethod": "card"
  }'
```

### 2) Transient error + retry

Перший RPC виклик падає з `UNAVAILABLE`, але клієнт робить retry і повертає успіх:

```bash
curl -X POST 'http://localhost:3022/orders/33333333-3333-3333-3333-333333333333/pay' \
  -H 'content-type: application/json' \
  -d '{
    "userId": "22222222-2222-2222-2222-222222222222",
    "amount": "20.00",
    "currency": "USD",
    "idempotencyKey": "resilience-demo-2",
    "simulateUnavailableOnce": true
  }'
```

### 3) Non-transient error (без retry)

```bash
curl -X POST 'http://localhost:3022/orders/44444444-4444-4444-4444-444444444444/pay' \
  -H 'content-type: application/json' \
  -d '{
    "userId": "22222222-2222-2222-2222-222222222222",
    "amount": "0",
    "currency": "USD"
  }'
```

## Як пояснювати schema evolution на лекції

- Старі клієнти ігнорують нові additive поля proto.
- Нові клієнти можуть читати `provider_ref` і `schema_version`.
- Немає перевикористання tag numbers, немає rename/remove критичних полів.

## RPC vs async межі

- `Authorize` — sync RPC (короткий bounded виклик).
- `Capture`/`Refund` у продакшені краще виносити в async pipeline (queue/event), щоб уникати distributed monolith.
