import { ChildProcess, spawn } from 'child_process';
import { setTimeout as delay } from 'timers/promises';

const ORDERS_PORT = 3122;
const PAYMENTS_PORT = 5122;
const BASE_URL = `http://127.0.0.1:${ORDERS_PORT}`;

function startService(
  name: string,
  entrypoint: string,
  env: Record<string, string>
): ChildProcess {
  const child = spawn(
    'node',
    ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register', entrypoint],
    {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  child.stdout?.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk.toString()}`);
  });

  child.stderr?.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk.toString()}`);
  });

  return child;
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status >= 200) {
        return;
      }
    } catch {
      // no-op
    }
    await delay(300);
  }
  throw new Error(`Service is not ready: ${url}`);
}

async function postJson(
  url: string,
  body: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return { status: res.status, json };
}

async function stopService(proc: ChildProcess | undefined): Promise<void> {
  if (!proc || proc.killed) {
    return;
  }

  proc.kill('SIGTERM');
  await delay(300);
  if (!proc.killed) {
    proc.kill('SIGKILL');
  }
}

async function main() {
  let paymentsProc: ChildProcess | undefined;
  let ordersProc: ChildProcess | undefined;

  try {
    paymentsProc = startService('payments', 'src/payments-service/main.ts', {
      PAYMENTS_GRPC_BIND_URL: `127.0.0.1:${PAYMENTS_PORT}`
    });

    ordersProc = startService('orders', 'src/orders-service/main.ts', {
      ORDERS_PORT: String(ORDERS_PORT),
      PAYMENTS_GRPC_URL: `127.0.0.1:${PAYMENTS_PORT}`,
      PAYMENTS_RPC_TIMEOUT_MS: '1000',
      PAYMENTS_RPC_MAX_RETRIES: '2',
      PAYMENTS_RPC_BACKOFF_MS: '100'
    });

    await waitForHttp(`${BASE_URL}/orders/health`, 15000);

    const happy = await postJson(
      `${BASE_URL}/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '149.50',
        currency: 'USD',
        idempotencyKey: 'smoke-resilience-happy',
        paymentMethod: 'card'
      }
    );
    if (happy.status !== 201) {
      throw new Error(`Expected 201 for happy path, got ${happy.status}`);
    }

    const retry = await postJson(
      `${BASE_URL}/orders/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '25.00',
        currency: 'USD',
        idempotencyKey: 'smoke-resilience-retry',
        simulateUnavailableOnce: true
      }
    );
    if (retry.status !== 201) {
      throw new Error(`Expected 201 for retry path, got ${retry.status}`);
    }

    const idemRepeat = await postJson(
      `${BASE_URL}/orders/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '25.00',
        currency: 'USD',
        idempotencyKey: 'smoke-resilience-retry'
      }
    );

    if (idemRepeat.json.paymentId !== retry.json.paymentId) {
      throw new Error('Idempotency check failed for resilience flow');
    }

    const invalid = await postJson(
      `${BASE_URL}/orders/cccccccc-cccc-4ccc-8ccc-cccccccccccc/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '0',
        currency: 'USD'
      }
    );

    if (invalid.status !== 400) {
      throw new Error(`Expected 400 for invalid amount, got ${invalid.status}`);
    }

    console.log('E2E smoke passed for grpc-resilience-contract-evolution');
  } finally {
    await stopService(ordersProc);
    await stopService(paymentsProc);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
