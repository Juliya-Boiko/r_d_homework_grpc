# 14 gRPC Microservices

Це лекція 14 (хоча в частині prompt-файлів ще залишилась стара нумерація 13).

## Проєкти

- `payments-grpc-extraction` — базовий extraction Payments у gRPC сервіс.
- `grpc-resilience-contract-evolution` — timeout/retry/idempotency + еволюція контракту.

## Що покрито по темі лекції

- proto3 контракт-first
- NestJS gRPC server + gRPC client adapter
- межі відповідальності Orders vs Payments
- resilience патерни для RPC викликів
- backward-compatible schema evolution

## Швидкий старт

Для кожного підпроєкту окремо:

```bash
cd <project-folder>
cp .env.example .env
pnpm install
pnpm start:payments:dev
# new terminal
pnpm start:orders:dev
```

Postman колекції: `postman/`.
Глосарій термінів: `glossary-uk.md`.
E2E сценарії вручну: `e2e-checklist.md`.
