import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CreatePayment } from './order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post('')
  async createPayment(
    @Body() paymentData: CreatePayment,
    @Headers('origin') origin: string,
  ) {
    try {
      const paymentUrl = await this.orderService.createTransaction(
        paymentData,
        origin,
      );
      return {
        message: 'success createPayment',
        data: {
          url: paymentUrl,
        },
      };
    } catch (error) {
      throw new Error('Error creating payment: ' + error.message);
    }
  }
}
