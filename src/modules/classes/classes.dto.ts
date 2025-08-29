import { IsOptional, IsString } from 'class-validator';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';
import { UploadResult } from '../storage/storage.dto';

export class ClassQueries extends GetDataQueryDto {
  @IsOptional()
  @IsString()
  type?: string;
  @IsOptional()
  @IsString()
  category?: string;
}
export interface ClassData {
  count: number;
  id: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice?: number;
  duration: string;
  students: number;
  rating: number;
  type: ClassType;
  category: string;
  banner: UploadResult;
}

export type ClassType = 'live' | 'course';

export interface ClassDetail {
  id: string;
  title: string;
  instructor: string;
  instructorBio: string;
  price: number;
  originalPrice: number;
  duration: string;
  students: number;
  rating: number;
  type: ClassType;
  category: string;
  banner: string;
  isPurchased: boolean;
  description: string;
  whatYouWillLearn: string[];
  schedule: string;
  materials: Material[];
}

export interface Material {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  description: string;
}
