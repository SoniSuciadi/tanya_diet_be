import { Controller, Get, Param, Query } from '@nestjs/common';
import { PurchaseHistoryService } from './purchase-history.service';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { catchError } from 'src/common/utils/catchError'; // Pastikan import catchError

@Controller('purchase-history')
export class PurchaseHistoryController {
  constructor(
    private readonly purchaseHistoryService: PurchaseHistoryService,
  ) {}

  @Get('summary')
  async getSummary() {
    try {
      const data = await this.purchaseHistoryService.getSummary();
      return {
        message: 'Berhasil mengambil ringkasan pembelian',
        data,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengambil ringkasan pembelian');
    }
  }

  @Get('list-type/:type')
  async getList(
    @Query() queries: GetDataQueryDto,
    @Param('type') type: string,
  ) {
    try {
      const data = await this.purchaseHistoryService.getList(queries, type);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +queries.page,
        perPage: queries.rowsPerPage,
        items: data,
      };
      return {
        message: 'Berhasil mengambil daftar pembelian',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengambil daftar pembelian');
    }
  }
}
