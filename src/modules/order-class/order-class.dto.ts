import { IsArray, IsBoolean, IsString } from 'class-validator';
import { UploadResult } from '../storage/storage.dto';

export interface ClassOderData {
  id: string;
  price: number;
  originalPrice?: number;
}
export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  videoUrl: UploadResult;
  duration: string;
  preTestCompleted: boolean;
  postTestCompleted: boolean;
  videoComplate: boolean;
  keyPoints: string[];
}
export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export class TestResultDto {
  @IsString()
  question: string;

  @IsArray()
  options: string[];

  @IsString()
  correctAnswer: string;

  @IsString()
  userAnswer: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsString()
  explanation: string;
}
export class TestDto {
  @IsArray()
  testResult: TestResultDto;

  @IsBoolean()
  passed: boolean;
}
