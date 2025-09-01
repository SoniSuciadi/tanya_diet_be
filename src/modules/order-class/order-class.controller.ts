import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OrderClassService } from './order-class.service';
import { TestDto } from './order-class.dto';

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
  @Get(':classId/lesson/:lessonId')
  async getLessonById(
    @Param('classId') classId: string,
    @Param('lessonId') lessonId: string,
  ) {
    try {
      const data = await this.orderClassService.getLessonId(lessonId, classId);
      return {
        message: 'Berhasil mengambil data lesson',
        data,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  @Get('lesson/:lessonId/:context/test')
  async getClassById(
    @Param('lessonId') lessonId: string,
    @Param('context') context: 'Pre' | 'Post',
  ) {
    try {
      const data = await this.orderClassService.getTest(context, lessonId);
      return {
        message: 'Berhasil mengambil data class',
        data,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  @Patch(':classId/lesson/:lessonId/:context/test')
  async updateTest(
    @Param('lessonId') lessonId: string,
    @Param('context') context: 'Pre' | 'Post',
    @Body() body: TestDto,
    @Param('classId') classId: string,
  ) {
    try {
      await this.orderClassService.updateTestResult(
        classId,
        lessonId,
        context,
        body,
      );
      return {
        message: 'Berhasil memperbari data test',
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  @Patch(':classId/lesson/:lessonId/video')
  async updateVideoStatus(
    @Param('lessonId') lessonId: string,
    @Param('classId') classId: string,
  ) {
    try {
      await this.orderClassService.updateVideoStatus(classId, lessonId);
      return {
        message: 'Berhasil memperbari data video',
      };
    } catch (error) {
      console.log(
        '👻 ~ OrderClassController ~ updateVideoStatus ~ error:',
        error,
      );
      throw new Error(error.message);
    }
  }
}
