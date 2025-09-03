import { HttpException, HttpStatus } from '@nestjs/common';

export function catchError(error: unknown, message: string): void {
  if (error instanceof HttpException) {
    throw error;
  }

  throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
}
