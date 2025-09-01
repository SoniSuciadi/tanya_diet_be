import { Controller, Get, Param, Query } from '@nestjs/common';
import { PurchaseHistoryService } from './purchase-history.service';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';

@Controller('purchase-history')
export class PurchaseHistoryController {
  constructor(
    private readonly purchaseHistoryService: PurchaseHistoryService,
  ) {}

  @Get('summary')
  async getSummary() {
    const data = await this.purchaseHistoryService.getSummary();
    return {
      message: 'success get summary',
      data,
    };
  }
  @Get('list-type/:type')
  async getList(
    @Query() queries: GetDataQueryDto,
    @Param('type') type: string,
  ) {
    const data = await this.purchaseHistoryService.getList(queries, type);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +queries.page,
      perPage: queries.rowsPerPage,
      items: data,
    };
    return {
      message: 'success get list',
      data: objResult,
    };
  }
}
