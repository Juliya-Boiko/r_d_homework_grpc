import { ChildProcess, spawn } from 'child_process';
import { setTimeout as delay } from 'timers/promises';

const ORDERS_PORT = 3121;
const PAYMENTS_PORT = 5121;
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

async function getJson(url: string): Promise<{ status: number; json: any }> {
  const res = await fetch(url);
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
      PAYMENTS_RPC_TIMEOUT_MS: '2500'
    });

    await waitForHttp(`${BASE_URL}/orders/health`, 15000);

    const payResp = await postJson(
      `${BASE_URL}/orders/11111111-1111-4111-8111-111111111111/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '99.90',
        currency: 'USD',
        idempotencyKey: 'smoke-extraction-1'
      }
    );

    if (payResp.status !== 201) {
      throw new Error(`Expected 201 on authorize, got ${payResp.status}`);
    }

    const paymentId = payResp.json.paymentId as string;
    if (!paymentId) {
      throw new Error('Authorize response has no paymentId');
    }

    const statusResp = await getJson(
      `${BASE_URL}/orders/payments/${paymentId}/status`
    );

    if (statusResp.status !== 200) {
      throw new Error(`Expected 200 on status, got ${statusResp.status}`);
    }

    if (statusResp.json.paymentId !== paymentId) {
      throw new Error('Status response paymentId mismatch');
    }

    const idempotentResp = await postJson(
      `${BASE_URL}/orders/11111111-1111-4111-8111-111111111111/pay`,
      {
        userId: '22222222-2222-4222-8222-222222222222',
        amount: '99.90',
        currency: 'USD',
        idempotencyKey: 'smoke-extraction-1'
      }
    );

    if (idempotentResp.json.paymentId !== paymentId) {
      throw new Error('Idempotency check failed: different paymentId');
    }

    console.log('E2E smoke passed for payments-grpc-extraction');
  } finally {
    await stopService(ordersProc);
    await stopService(paymentsProc);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
