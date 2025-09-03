import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CreatePayment } from './order.dto';
import { OrderService } from './order.service';
import { catchError } from 'src/common/utils/catchError';

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
        message: 'success order payment',
        data: {
          url: paymentUrl,
        },
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat membuat payment');
    }
  }
}
