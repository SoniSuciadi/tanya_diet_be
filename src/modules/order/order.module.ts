// order.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { UserModule } from '../user/user.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    UserModule,
    WebsocketModule,
    forwardRef(() => PaymentModule), // OrderService pakai PaymentService
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService], // <<< wajib
})
export class OrderModule {}
