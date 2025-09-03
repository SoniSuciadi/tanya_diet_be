import { Controller, Post, Body, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MidtransWebhookPayload } from './payment.dto';
import { OrderService } from '../order/order.service';
import { OrderClassService } from '../order-class/order-class.service';
import { catchError } from 'src/common/utils/catchError';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly orderClassService: OrderClassService,
  ) {}

  @Post('webhook')
  async webhookTest(@Body() body: MidtransWebhookPayload) {
    try {
      if (body.order_id.startsWith('payment_notif_test')) {
        return { message: `Payment for order ${body.order_id} is successful` };
      }
      const contextPaymnetId = body.order_id.split('_')[1];
      const isValidSignature = this.paymentService.validateSignature(body);

      if (!isValidSignature) {
        this.logger.warn('Invalid signature received');
        throw new Error('Invalid signature');
      }
      let paymentStatus;

      switch (contextPaymnetId) {
        case `${process.env.APP_NAME}Cls`:
          paymentStatus =
            await this.orderClassService.handlePaymentStatus(body);
          return paymentStatus;
          break;
        case process.env.APP_NAME:
          paymentStatus = await this.orderService.handlePaymentStatus(body);
          return paymentStatus;
        default:
          throw new Error('Error processing webhook');
      }
    } catch (error) {
      catchError(error, 'Kesalahan saat memproses webhook');
    }
  }
}
