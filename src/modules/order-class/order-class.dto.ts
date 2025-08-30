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
