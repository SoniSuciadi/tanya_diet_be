import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { OrderClassService } from './order-class.service';

@Controller('order-class')
export class OrderClassController {
  constructor(private orderClassService: OrderClassService) {}
  @Post(':id')
  async createOrderClass(
    @Param('id') id: string,
    @Headers('origin') origin: string,
  ) {
    try {
      const url = await this.orderClassService.createOrderClass(id, origin);
      return {
        message: 'Berhasil membuat order class',
        data: {
          url,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  @Get('lesson/:classId/:lessonId')
  async getLessonById(
    @Param('classId') classId: string,
    @Param('lessonId') lessonId: string,
  ) {
    try {
      const data = await this.orderClassService.getLessonId(lessonId, classId);
      console.log('👻 ~ OrderClassController ~ getLessonById ~ data:', data);
      return {
        message: 'Berhasil mengambil data lesson',
        data,
      };
    } catch (error) {
      console.log('👻 ~ OrderClassController ~ getLessonById ~ error:', error);
      throw new Error(error.message);
    }
  }
}
