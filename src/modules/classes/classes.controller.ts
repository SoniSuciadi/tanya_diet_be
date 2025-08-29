import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassQueries } from './classes.dto';

@Controller('classes')
export class ClassesController {
  constructor(private classService: ClassesService) {}
  @Get('')
  async getClassList(@Query() classQueries: ClassQueries) {
    console.log(
      '👻 ~ ClassesController ~ getClassList ~ classQueries:',
      classQueries,
    );
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
  @Get(':id')
  async getClassById(@Param('id') id: string) {
    const data = await this.classService.getClassById(id);
    return {
      message: 'Berhasil mengambil data class',
      data,
    };
  }
}
