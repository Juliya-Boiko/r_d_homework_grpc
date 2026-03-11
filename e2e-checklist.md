# E2E Checklist (лекція 14)

## 1) Швидка автоматична перевірка

### payments-grpc-extraction

```bash
cd payments-grpc-extraction
pnpm install
pnpm test
pnpm e2e:smoke
```

### grpc-resilience-contract-evolution

```bash
cd grpc-resilience-contract-evolution
pnpm install
pnpm test
pnpm e2e:smoke
```

## 2) Ручна перевірка через Postman

Імпортуй колекції з папки `postman/`:

- `lesson14-payments-grpc-extraction.postman_collection.json`
- `lesson14-grpc-resilience-contract-evolution.postman_collection.json`

## 3) Що дивитися в логах

### extraction

Очікувані логи:
- `PaymentsGrpcController authorize orderId=... paymentId=...`
- `PaymentsGrpcClient authorize ok orderId=... paymentId=...`
- `PaymentsGrpcClient status ok paymentId=...`

### resilience

Очікувані логи:
- `retry authorize attempt=... code=14 delayMs=...` (для transient case)
- `PaymentsGrpcController authorize orderId=... paymentId=...`
- `PaymentsGrpcClient authorize ok orderId=... paymentId=...`
- `Payments validation failed: amount must be > 0` (для невалідного amount)

## 4) Мінімальний demo flow на лайві

1. Запустити `pnpm e2e:smoke` в одному з проєктів.
2. Показати, що smoke зелений.
3. Відкрити Postman і прогнати колекцію вручну.
4. На логах показати:
   - authorize success;
   - retry на transient помилці (resilience);
   - коректну помилку 400 без retry.
