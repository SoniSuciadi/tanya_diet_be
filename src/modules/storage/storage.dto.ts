import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class UploadResult {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsObject()
  @IsNotEmpty()
  meta: {
    size: number;
    encoding: string;
    mimetype: string;
    fieldname: string;
    originalname: string;
  };

  @IsString()
  @IsNotEmpty()
  thumbnail: string;
}
