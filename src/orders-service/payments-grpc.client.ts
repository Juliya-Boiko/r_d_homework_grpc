import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { PAYMENTS_SERVICE_NAME } from '../common/grpc.constants';

interface AuthorizeRequest {
  orderId: string;
  userId: string;
  total: {
    amount: string;
    currency: string;
  };
  idempotencyKey?: string;
}

export interface AuthorizeResponse {
  paymentId: string;
  status: string;
  message: string;
}

interface GetPaymentStatusRequest {
  paymentId: string;
}

export interface GetPaymentStatusResponse {
  paymentId: string;
  status: string;
  orderId: string;
}

interface PaymentsGrpcService {
  Authorize(payload: AuthorizeRequest): Observable<AuthorizeResponse>;
  GetPaymentStatus(
    payload: GetPaymentStatusRequest
  ): Observable<GetPaymentStatusResponse>;
}

@Injectable()
export class PaymentsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(PaymentsGrpcClient.name);
  private paymentsService!: PaymentsGrpcService;

  constructor(
    @Inject('PAYMENTS_GRPC_CLIENT') private readonly client: ClientGrpc,
    private readonly configService: ConfigService
  ) {}

  onModuleInit(): void {
    this.paymentsService =
      this.client.getService<PaymentsGrpcService>(PAYMENTS_SERVICE_NAME);
  }

  async authorize(payload: AuthorizeRequest): Promise<AuthorizeResponse> {
    const timeoutMs = Number(
      this.configService.get<string>('PAYMENTS_RPC_TIMEOUT_MS') ?? '2500'
    );

    try {
      const result = await firstValueFrom(
        this.paymentsService.Authorize(payload).pipe(timeout(timeoutMs))
      );
      this.logger.log(
        `authorize ok orderId=${payload.orderId} paymentId=${result.paymentId}`
      );
      return result;
    } catch (error) {
      this.logger.error(`authorize failed orderId=${payload.orderId}`);
      throw this.mapGrpcError(error);
    }
  }

  async getStatus(paymentId: string): Promise<GetPaymentStatusResponse> {
    const timeoutMs = Number(
      this.configService.get<string>('PAYMENTS_RPC_TIMEOUT_MS') ?? '2500'
    );

    try {
      const result = await firstValueFrom(
        this.paymentsService
          .GetPaymentStatus({ paymentId })
          .pipe(timeout(timeoutMs))
      );
      this.logger.log(`status ok paymentId=${paymentId}`);
      return result;
    } catch (error) {
      this.logger.error(`status failed paymentId=${paymentId}`);
      throw this.mapGrpcError(error);
    }
  }

  private mapGrpcError(error: unknown): Error {
    const code = (error as { code?: number })?.code;

    if (code === GrpcStatus.DEADLINE_EXCEEDED) {
      return new GatewayTimeoutException('Payments service timeout');
    }

    if (code === GrpcStatus.UNAVAILABLE) {
      return new BadGatewayException('Payments service unavailable');
    }

    return new BadGatewayException('Payments service call failed');
  }
}
