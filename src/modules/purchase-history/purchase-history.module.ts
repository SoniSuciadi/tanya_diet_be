import { Module } from '@nestjs/common';
import { PurchaseHistoryController } from './purchase-history.controller';
import { PurchaseHistoryService } from './purchase-history.service';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [PurchaseHistoryController],
  providers: [PurchaseHistoryService],
  imports: [UserModule],
})
export class PurchaseHistoryModule {}
