import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassQueries } from './classes.dto';
import { catchError } from 'src/common/utils/catchError';

@Controller('classes')
export class ClassesController {
  constructor(private classService: ClassesService) {}

  @Get('')
  async getClassList(@Query() classQueries: ClassQueries) {
    try {
      const data = await this.classService.classList(classQueries);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +classQueries.page,
        perPage: classQueries.rowsPerPage,
        items: data,
      };
      return {
        message: 'Berhasil mengambil data class',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil daftar class');
    }
  }

  @Get('category-list')
  async getCategoryList() {
    try {
      const data = await this.classService.getCategoryList();
      return {
        message: 'Berhasil mengambil daftar kategori class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil daftar kategori class');
    }
  }

  @Get('live-class-room/:id')
  async getLiveClassRoom(@Param('id') id: string) {
    try {
      const data = await this.classService.getLiveClassRoom(id);
      return {
        message: 'Berhasil mengambil data live class room',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data live class room');
    }
  }

  @Get(':id')
  async getClassById(@Param('id') id: string) {
    try {
      const data = await this.classService.getClassById(id);
      return {
        message: 'Berhasil mengambil data class',
        data,
      };
    } catch (error) {
      catchError(error, 'Kesalahan saat mengambil data class');
    }
  }
}
