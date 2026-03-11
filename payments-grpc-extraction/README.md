# Payments gRPC Extraction

Навчальний проєкт для лекції 14: винесення Payments в окремий gRPC-сервіс і інтеграція Orders -> Payments через контракт `proto/payments.proto`.

## Що реалізовано

- `payments-service` як окремий gRPC сервер (`Transport.GRPC`)
- `orders-service` як HTTP API з gRPC клієнтом
- контракт-first підхід (`proto/payments.proto` — source of truth)
- базовий happy-path: `POST /orders/:orderId/pay`
- мінімальний timeout на RPC виклики (`PAYMENTS_RPC_TIMEOUT_MS`)
- базовий idempotency у `Authorize` по `idempotencyKey`

## Структура

- `proto/payments.proto` — gRPC контракт
- `src/payments-service/*` — сервер Payments
- `src/orders-service/*` — HTTP Orders + gRPC client adapter
- `docker-compose.yml` — локальний запуск 2 сервісів у контейнерах

## Локальний запуск (без Docker)

```bash
cp .env.example .env
pnpm install
pnpm start:payments:dev
# в іншому терміналі
pnpm start:orders:dev
```

- Orders API: `http://localhost:3021`
- Payments gRPC: `localhost:5021`

## Тести

```bash
pnpm test
```

Покриває `PaymentsService`: авторизацію, idempotency, `getStatus`.

## Автоматичний E2E smoke

```bash
pnpm e2e:smoke
```

Скрипт:
- піднімає обидва сервіси на тимчасових портах (`3121`, `5121`);
- чекає readiness через `GET /orders/health`;
- робить `POST /orders/:id/pay` + `GET /orders/payments/:id/status`;
- перевіряє idempotency;
- виводить runtime-логи обох сервісів у консоль.

## Запуск через Docker Compose

```bash
docker compose up --build
```

## Postman

Колекція для ручної перевірки:

- `../postman/lesson14-payments-grpc-extraction.postman_collection.json`

## Демо сценарій

1) Authorize payment

```bash
curl -X POST 'http://localhost:3021/orders/11111111-1111-1111-1111-111111111111/pay' \
  -H 'content-type: application/json' \
  -d '{
    "userId": "22222222-2222-2222-2222-222222222222",
    "amount": "99.90",
    "currency": "USD",
    "idempotencyKey": "demo-key-001"
  }'
```

2) Check payment status (вставити `paymentId` з попередньої відповіді)

```bash
curl 'http://localhost:3021/orders/payments/<paymentId>/status'
```

## Межі відповідальності

- Orders володіє оркестрацією checkout виклику.
- Payments володіє payment state і gRPC контрактом.
- Взаємодія тільки через gRPC клієнт, без прямого імпорту бізнес-коду.
