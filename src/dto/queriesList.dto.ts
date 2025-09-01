import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetDataQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  search: string;

  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  rowsPerPage: number;

  @IsOptional()
  @IsString()
  order: string;

  @IsOptional()
  @IsString()
  orderBy: string;
}
