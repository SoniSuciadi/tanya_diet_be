import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
  imports: [UserModule],
})
export class ClassesModule {}
