// order-class.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { OrderClassController } from './order-class.controller';
import { OrderClassService } from './order-class.service';
import { UserModule } from '../user/user.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [UserModule, WebsocketModule, forwardRef(() => PaymentModule)],
  controllers: [OrderClassController],
  providers: [OrderClassService],
  exports: [OrderClassService],
})
export class OrderClassModule {}
