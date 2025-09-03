import { Injectable, Logger } from '@nestjs/common';
import * as midtransClient from 'midtrans-client';
import * as crypto from 'crypto';
import { MidtransWebhookPayload } from './payment.dto';
import * as dotenv from 'dotenv';
dotenv.config();
@Injectable()
export class PaymentService {
  public readonly snap: midtransClient.Snap;

  private readonly logger = new Logger(PaymentService.name);

  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_PRODUCTION === 'TRUE',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  validateSignature(payload: MidtransWebhookPayload): boolean {
    const grossAmount = String(payload.gross_amount);

    const dataToHash = `${payload.order_id}${payload.status_code}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`;

    this.logger.log(`Payload for Hash: ${dataToHash}`);

    const hash = crypto.createHash('sha512').update(dataToHash).digest('hex');

    this.logger.log(`Generated Hash: ${hash}`);
    this.logger.log(`Received Signature: ${payload.signature_key}`);

    return hash === payload.signature_key;
  }
}
