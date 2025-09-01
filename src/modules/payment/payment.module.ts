// payment.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UserModule } from '../user/user.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { OrderModule } from '../order/order.module';
import { OrderClassModule } from '../order-class/order-class.module';

@Module({
  imports: [
    UserModule,
    WebsocketModule,
    forwardRef(() => OrderModule), // butuh OrderService
    forwardRef(() => OrderClassModule), // butuh OrderClassService
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
