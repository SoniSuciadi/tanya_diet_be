import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassQueries } from './classes.dto';

@Controller('classes')
export class ClassesController {
  constructor(private classService: ClassesService) {}
  @Get('')
  async getClassList(@Query() classQueries: ClassQueries) {
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
  }
  @Get('category-list')
  async getCategoryList() {
    console.log('masukkkk');
    const data = await this.classService.getCategoryList();
    return {
      message: 'Berhasil mengambil data class',
      data,
    };
  }
  @Get('live-class-room/:id')
  async getLiveClassRoom(@Param('id') id: string) {
    const data = await this.classService.getLiveClassRoom(id);
    return {
      message: 'Berhasil mengambil data class',
      data,
    };
  }
  @Get(':id')
  async getClassById(@Param('id') id: string) {
    const data = await this.classService.getClassById(id);
    return {
      message: 'Berhasil mengambil data class',
      data,
    };
  }
}
