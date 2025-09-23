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
import { catchError } from 'src/common/utils/catchError';

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
      catchError(error, 'Kesalahan saat membuat order class');
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
      catchError(error, 'Kesalahan saat mengambil data lesson');
    }
  }

  @Get('lesson/:lessonId/:context/test')
  async getClassById(
    @Param('lessonId') lessonId: string,
    @Param('context') context: 'pre' | 'post',
  ) {
    try {
      const data = await this.orderClassService.getTest(context, lessonId);
      return {
        message: 'Berhasil mengambil data class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data test');
    }
  }

  @Patch(':classId/lesson/:lessonId/:context/test')
  async updateTest(
    @Param('lessonId') lessonId: string,
    @Param('context') context: 'pre' | 'post',
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
        message: 'Berhasil memperbarui data test',
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat memperbarui data test');
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
        message: 'Berhasil memperbarui data video',
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat memperbarui status video');
    }
  }

  @Get('live-session/:classId')
  async getLiveSessionById(@Param('classId') classId: string) {
    try {
      const data = await this.orderClassService.getLiveSessionById(classId);
      return {
        message: 'Berhasil mengambil data live session',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data live session');
    }
  }
}
