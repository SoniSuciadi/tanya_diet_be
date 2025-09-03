import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

// ErrorResponse interface yang lebih ketat
export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number;
  code?: string;
  table?: string;
  column?: string;
  detail?: string;
  query?: string;
  constraint?: string;
}

@Catch(HttpException)
export class HandleHttpError implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const message = exception.message;

    const resError: ErrorResponse = {
      name: exception.constructor.name || 'Internal Server Error',
      message: message || 'Internal Server Error',
      statusCode: status || 500,
    };

    // Customize the error response
    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'object') {
        resError.detail = responseObj['message'] || responseObj['detail'];
      }
    } else {
      resError.detail = message;
    }

    response.status(resError.statusCode).json(resError);
  }
}
