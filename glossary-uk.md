# Глосарій (лекція 14: gRPC та мікросервіси)

- **gRPC** — RPC протокол поверх HTTP/2 з чітким контрактом через `.proto`.
- **Proto contract** — файл `.proto`, який задає service/method/messages і є source of truth.
- **Contract-first** — підхід, коли спочатку проєктується контракт, потім реалізація.
- **Client adapter** — окремий клас у сервісі-клієнті, що інкапсулює RPC виклики.
- **Deadline / Timeout** — ліміт часу на RPC; захищає API від зависань залежностей.
- **Transient failure** — тимчасова помилка (`UNAVAILABLE`, інколи `DEADLINE_EXCEEDED`), для якої допустимий retry.
- **Retry policy** — правила повтору (скільки разів, для яких кодів, з яким backoff).
- **Backoff** — затримка між retries; зменшує ризик retry storm.
- **Retry storm** — лавина повторних запитів під час деградації залежності.
- **Idempotency key** — ключ, який дозволяє безпечно повторити side-effect операцію.
- **Error mapping** — перетворення gRPC статусів у доменні/HTTP помилки.
- **Schema evolution** — зміна контракту без зламу сумісності (additive optional fields).
- **Backward compatibility** — старий клієнт продовжує працювати з новою версією контракту.
- **Distributed monolith** — анти-патерн, коли сервіси жорстко синхронно залежать один від одного.
- **RPC sphere** — область операцій, які логічно мають виконуватись синхронно.
- **Async sphere** — область операцій, які краще робити через queue/event (наприклад, capture/refund).
